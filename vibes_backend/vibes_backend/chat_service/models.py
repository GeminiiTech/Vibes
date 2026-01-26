from django.db import models
from auth_service.models import Profile


class Conversation(models.Model):
    """A conversation between two users."""
    participants = models.ManyToManyField(Profile, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        participant_names = ', '.join([p.username for p in self.participants.all()[:2]])
        return f"Conversation: {participant_names}"

    def get_other_participant(self, user):
        """Get the other participant in a 1-on-1 conversation."""
        return self.participants.exclude(id=user.id).first()


class Message(models.Model):
    """A message within a conversation."""
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    image = models.ImageField(upload_to='chat_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:30]}"
