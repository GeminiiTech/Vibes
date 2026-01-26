from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.shortcuts import get_object_or_404
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from auth_service.models import Profile


class ConversationListView(APIView):
    """List all conversations for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(
            participants=request.user
        ).distinct()
        serializer = ConversationSerializer(
            conversations, many=True, context={'request': request}
        )
        return Response(serializer.data)


class ConversationCreateOrGetView(APIView):
    """Create a new conversation or get existing one with a user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_user_id = request.data.get('user_id')
        if not other_user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if int(other_user_id) == request.user.id:
            return Response(
                {'error': 'Cannot start conversation with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )

        other_user = get_object_or_404(Profile, id=other_user_id)

        # Check if conversation already exists
        existing = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=other_user
        ).first()

        if existing:
            serializer = ConversationSerializer(existing, context={'request': request})
            return Response(serializer.data)

        # Create new conversation
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, other_user)
        conversation.save()

        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversationDetailView(APIView):
    """Get a specific conversation."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        conversation = get_object_or_404(
            Conversation.objects.filter(participants=request.user),
            pk=pk
        )
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data)


class MessageListView(APIView):
    """List messages in a conversation."""
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.filter(participants=request.user),
            pk=conversation_id
        )

        # Mark messages as read
        conversation.messages.filter(is_read=False).exclude(
            sender=request.user
        ).update(is_read=True)

        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.filter(participants=request.user),
            pk=conversation_id
        )

        content = request.data.get('content', '').strip()
        image = request.FILES.get('image')

        if not content and not image:
            return Response(
                {'error': 'Message content or image is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            image=image
        )

        # Update conversation timestamp
        conversation.save()  # This updates updated_at

        serializer = MessageSerializer(message, context={'request': request})

        # Broadcast to WebSocket clients
        self._broadcast_message(conversation_id, serializer.data)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _broadcast_message(self, conversation_id, message_data):
        """Broadcast message to WebSocket channel group."""
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"chat_{conversation_id}",
                {
                    "type": "chat_message",
                    "message": message_data,
                }
            )


class MarkMessagesReadView(APIView):
    """Mark all messages in a conversation as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.filter(participants=request.user),
            pk=conversation_id
        )

        updated = conversation.messages.filter(is_read=False).exclude(
            sender=request.user
        ).update(is_read=True)

        # Broadcast read receipt to WebSocket clients
        if updated > 0:
            self._broadcast_read_receipt(conversation_id, request.user.id)

        return Response({'marked_read': updated})

    def _broadcast_read_receipt(self, conversation_id, reader_id):
        """Broadcast read receipt to WebSocket channel group."""
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"chat_{conversation_id}",
                {
                    "type": "chat_messages_read",
                    "reader_id": reader_id,
                }
            )
