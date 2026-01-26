import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

from .models import Conversation, Message
from .serializers import MessageSerializer


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat messaging.

    URL pattern: ws/chat/<conversation_id>/
    Group naming: chat_<conversation_id>

    Client -> Server messages:
        {"type": "send_message", "content": "Hello!"}
        {"type": "typing", "is_typing": true}
        {"type": "mark_read"}

    Server -> Client messages:
        {"type": "new_message", "message": {...}}
        {"type": "typing", "user_id": 5, "is_typing": true}
        {"type": "messages_read", "reader_id": 5}
    """

    async def connect(self):
        self.user = self.scope.get("user")
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"

        # Reject unauthenticated connections
        if isinstance(self.user, AnonymousUser) or not self.user:
            await self.close()
            return

        # Verify user is a participant in this conversation
        is_participant = await self.check_participant()
        if not is_participant:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle incoming WebSocket messages from client."""
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "send_message":
                await self.handle_send_message(data)
            elif message_type == "typing":
                await self.handle_typing(data)
            elif message_type == "mark_read":
                await self.handle_mark_read()
        except json.JSONDecodeError:
            pass

    async def handle_send_message(self, data):
        """Create message in DB and broadcast to group."""
        content = data.get("content", "").strip()
        if not content:
            return

        # Save message to database
        message_data = await self.create_message(content)

        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message_data,
            }
        )

    async def handle_typing(self, data):
        """Broadcast typing indicator to group."""
        is_typing = data.get("is_typing", False)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_typing",
                "user_id": self.user.id,
                "is_typing": is_typing,
            }
        )

    async def handle_mark_read(self):
        """Mark messages as read and notify group."""
        await self.mark_messages_read()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_messages_read",
                "reader_id": self.user.id,
            }
        )

    # ----- Group message handlers (receive from channel layer) -----

    async def chat_message(self, event):
        """Send new message to WebSocket."""
        await self.send(text_data=json.dumps({
            "type": "new_message",
            "message": event["message"],
        }))

    async def chat_typing(self, event):
        """Send typing indicator to WebSocket (skip sender)."""
        if event["user_id"] != self.user.id:
            await self.send(text_data=json.dumps({
                "type": "typing",
                "user_id": event["user_id"],
                "is_typing": event["is_typing"],
            }))

    async def chat_messages_read(self, event):
        """Send read receipt to WebSocket (skip reader)."""
        if event["reader_id"] != self.user.id:
            await self.send(text_data=json.dumps({
                "type": "messages_read",
                "reader_id": event["reader_id"],
            }))

    # ----- Database operations -----

    @database_sync_to_async
    def check_participant(self):
        """Check if user is a participant in the conversation."""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return conversation.participants.filter(id=self.user.id).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def create_message(self, content):
        """Create a new message in the database."""
        conversation = Conversation.objects.get(id=self.conversation_id)

        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
        )

        # Update conversation timestamp
        conversation.save()

        # Return serialized message data
        return {
            "id": message.id,
            "conversation": message.conversation.id,
            "sender_id": message.sender.id,
            "sender_username": message.sender.username,
            "sender_fullname": message.sender.fullname,
            "sender_profile_picture": message.sender.profile_picture.url if message.sender.profile_picture else None,
            "content": message.content,
            "image": None,
            "created_at": message.created_at.isoformat(),
            "is_read": message.is_read,
        }

    @database_sync_to_async
    def mark_messages_read(self):
        """Mark all messages from other user as read."""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            conversation.messages.filter(
                is_read=False
            ).exclude(
                sender=self.user
            ).update(is_read=True)
        except Conversation.DoesNotExist:
            pass
