from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_fullname = serializers.CharField(source='sender.fullname', read_only=True)
    sender_profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender_id', 'sender_username',
            'sender_fullname', 'sender_profile_picture', 'content',
            'image', 'created_at', 'is_read'
        ]
        read_only_fields = ['id', 'conversation', 'sender_id', 'created_at']

    def get_sender_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.sender.profile_picture and request:
            return request.build_absolute_uri(obj.sender.profile_picture.url)
        return None


class ParticipantSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    fullname = serializers.CharField()
    profile_picture = serializers.SerializerMethodField()

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and request:
            return request.build_absolute_uri(obj.profile_picture.url)
        return None


class ConversationSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'other_participant', 'last_message',
            'unread_count', 'created_at', 'updated_at'
        ]

    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request:
            other = obj.get_other_participant(request.user)
            if other:
                return ParticipantSerializer(other, context=self.context).data
        return None

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'content': last_msg.content[:50],
                'sender_id': last_msg.sender.id,
                'created_at': last_msg.created_at,
                'is_read': last_msg.is_read,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0
