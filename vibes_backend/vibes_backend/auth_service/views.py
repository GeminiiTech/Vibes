import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer,UserSerializer, MyTokenObtainPairSerializer, FollowSerializer
from .models import Profile, Follow

logger = logging.getLogger(__name__)


class ProfileView(APIView):
    """
    View to handle user profile operations.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):
        """
        Retrieve a user profile by user ID.
        If no user ID is provided, return the authenticated user's profile.
        """
        if user_id:
            try:
                profile = Profile.objects.get(id=user_id)
            except Profile.DoesNotExist:
                return Response({"error": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            profile = request.user

        serializer = UserSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, user_id=None):
        """
        Update the authenticated user's profile.
        Only allows updating fullname and profile_picture.
        """
        profile = request.user

        # Update fullname if provided
        fullname = request.data.get('fullname')
        if fullname:
            profile.fullname = fullname

        # Update profile picture if provided
        profile_picture = request.FILES.get('profile_picture')
        if profile_picture:
            # Delete old profile picture if it exists
            if profile.profile_picture:
                profile.profile_picture.delete(save=False)
            profile.profile_picture = profile_picture

        try:
            profile.save()
            serializer = UserSerializer(profile, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error updating profile: %s", str(e), exc_info=True)
            return Response(
                {"error": "Failed to update profile."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RegisterUserView(APIView):
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = Profile.objects.create_user(
                    email=serializer.validated_data['email'],
                    password=request.data.get('password'),  # Ensure password is provided
                    fullname=serializer.validated_data.get('fullname', ''),
                    username=serializer.validated_data.get('username', ''),
                    profile_picture=request.FILES.get('profile_picture')
                )
                user.save()

                # Generate JWT tokens for immediate login
                refresh = RefreshToken.for_user(user)

                return Response({
                    'user': UserSerializer(user).data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error("Error during user registration: %s", str(e), exc_info=True)
                return Response(
                    {"error": "Internal server error. Please try again later."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.info("User registration validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class FollowUserView(APIView):
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]
    """
    View to handle follow/unfollow actions.
    """
    def post(self, request, format=None):
        follower_id = request.data.get('follower_id')
        followed_id = request.data.get('followed_id')
        
        if not followed_id:
            return Response({"error": "Followed user ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if follower_id == followed_id:
            return Response({'detail': "You can't follow yourself."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            follower = Profile.objects.get(id=follower_id)
            followed = Profile.objects.get(id=followed_id)

            if Follow.objects.filter(follower=follower, followed=followed).exists():
                return Response({'detail': 'Already following.'}, status=status.HTTP_400_BAD_REQUEST)

            Follow.objects.create(follower=follower, followed=followed)
            return Response({'detail': 'Followed successfully.'}, status=status.HTTP_201_CREATED)
        except Profile.DoesNotExist:
            return Response({"error": "Follower or followed user not found."}, status=status.HTTP_404_NOT_FOUND)    


class UnfollowUserView(APIView):
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]
    """
    View to handle unfollow actions.
    """
    def post(self, request, format=None):
        follower_id = request.data.get('follower_id')
        followed_id = request.data.get('followed_id')
        
        if not followed_id:
            return Response({"error": "Followed user ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            follower = Profile.objects.get(id=follower_id)
            followed = Profile.objects.get(id=followed_id)

            follow_instance = Follow.objects.filter(follower=follower, followed=followed).first()
            if not follow_instance:
                return Response({'detail': 'Not following this user.'}, status=status.HTTP_400_BAD_REQUEST)

            follow_instance.delete()
            return Response({'detail': 'Unfollowed successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except Profile.DoesNotExist:
            return Response({"error": "Follower or followed user not found."}, status=status.HTTP_404_NOT_FOUND)
        
class FollowStatusView(APIView):
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        """
        Check if a user is following another user.
        Expected query parameters: follower_id, following_id

        """
        follower_id = request.query_params.get('follower_id')
        following_id = request.query_params.get('following_id')

        is_following = Follow.objects.filter(
            follower_id=follower_id,
            followed_id=following_id
        ).exists()

        return Response({'is_following': is_following}, status=status.HTTP_200_OK)


class FollowersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user_id = request.query_params.get('user_id')
            if user_id:
                try:
                    user = Profile.objects.get(id=user_id)
                except Profile.DoesNotExist:
                    return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            else:
                user = request.user

            followers = Follow.objects.filter(followed=user).select_related("follower")
            data = [
                {
                    "id": f.follower.id,
                    "fullname": f.follower.fullname,
                    "username": f.follower.username,
                    "profile_picture": request.build_absolute_uri(f.follower.profile_picture.url) if f.follower.profile_picture else None,
                }
                for f in followers
            ]
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error fetching followers: %s", str(e), exc_info=True)
            return Response({"error": "Could not retrieve followers."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FollowingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user_id = request.query_params.get('user_id')
            if user_id:
                try:
                    user = Profile.objects.get(id=user_id)
                except Profile.DoesNotExist:
                    return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            else:
                user = request.user

            following = Follow.objects.filter(follower=user).select_related("followed")
            data = [
                {
                    "id": f.followed.id,
                    "fullname": f.followed.fullname,
                    "username": f.followed.username,
                    "profile_picture": request.build_absolute_uri(f.followed.profile_picture.url) if f.followed.profile_picture else None,
                }
                for f in following
            ]
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error fetching following: %s", str(e), exc_info=True)
            return Response({"error": "Could not retrieve following users."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)