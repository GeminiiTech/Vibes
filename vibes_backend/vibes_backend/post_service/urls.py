from django.urls import path
from .views import (
    PostListCreateView,
    PostLikeView,
    PostUnlikeView,
    CommentListCreateView,
)

urlpatterns = [
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:pk>/like/', PostLikeView.as_view(), name='post-like'),
    path('posts/<int:pk>/unlike/', PostUnlikeView.as_view(), name='post-unlike'),
    path('posts/<int:pk>/comments/', CommentListCreateView.as_view(), name='post-comments'),
]
