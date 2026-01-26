from django.urls import path
from .views import (
    ConversationListView,
    ConversationCreateOrGetView,
    ConversationDetailView,
    MessageListView,
    MarkMessagesReadView,
)

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/create/', ConversationCreateOrGetView.as_view(), name='conversation-create'),
    path('conversations/<int:pk>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:conversation_id>/messages/', MessageListView.as_view(), name='message-list'),
    path('conversations/<int:conversation_id>/read/', MarkMessagesReadView.as_view(), name='mark-read'),
]
