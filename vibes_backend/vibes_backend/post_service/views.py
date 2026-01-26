import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


def broadcast_event(group: str, message: dict):
    """Broadcast event to channel layer. Fails silently if Redis is unavailable."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(group, message)
    except Exception as e:
        logger.warning(f"Failed to broadcast event: {e}")


# ------------------------------------------------------
#   POST LIST + CREATE
# ------------------------------------------------------
class PostListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.query_params.get("user_id")

        if user_id:
            posts = Post.objects.filter(user_id=user_id).order_by("-created_at")
        else:
            posts = Post.objects.all().order_by("-created_at")

        serializer = PostSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = PostSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            post = serializer.save(user=request.user)

            # Broadcast real-time post event (non-blocking)
            broadcast_event(
                "posts",
                {
                    "type": "post_update",
                    "event": "new_post",
                    "post": PostSerializer(post, context={"request": request}).data,
                },
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ------------------------------------------------------
#   LIKE
# ------------------------------------------------------
class PostLikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)

        like, created = Like.objects.get_or_create(user=request.user, post=post)

        if created:
            message = "Liked."
        else:
            message = "Already liked."

        # Broadcast real-time like event (non-blocking)
        broadcast_event(
            "posts",
            {
                "type": "post_update",
                "event": "like",
                "post_id": post.id,
                "likes_count": post.likes.count(),
            },
        )

        return Response({"detail": message})


# ------------------------------------------------------
#   UNLIKE
# ------------------------------------------------------
class PostUnlikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)

        Like.objects.filter(user=request.user, post=post).delete()

        # Broadcast unlike event (non-blocking)
        broadcast_event(
            "posts",
            {
                "type": "post_update",
                "event": "unlike",
                "post_id": post.id,
                "likes_count": post.likes.count(),
            },
        )

        return Response({"detail": "Unliked."})


# ------------------------------------------------------
#   COMMENTS
# ------------------------------------------------------
class CommentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        comments = Comment.objects.filter(post_id=pk).order_by("-created_at")
        serializer = CommentSerializer(comments, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)

        serializer = CommentSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            comment = serializer.save(user=request.user, post=post)

            # Broadcast real-time comment event (non-blocking)
            broadcast_event(
                "posts",
                {
                    "type": "post_update",
                    "event": "comment",
                    "post_id": post.id,
                    "comment": CommentSerializer(comment, context={"request": request}).data,
                    "comments_count": post.comments.count(),
                },
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
