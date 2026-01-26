from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Profile, Follow

class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_followed_by_me = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        model = Profile
        fields = [
            'id', 'password', 'email', 'fullname', 'username',
            'followers_count', 'following_count', 'is_followed_by_me',
            'is_active', 'is_verified', 'profile_picture'
        ]
        read_only_fields = ['id', 'is_active']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_followed_by_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, followed=obj).exists()
        return False    

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Profile
        fields = ['email', 'password', 'fullname', 'username','profile_picture']

    def create(self, validated_data):
        return Profile.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            fullname=validated_data['fullname'],
            username=validated_data['username'],
            profile_picture=validated_data.get('profile_picture')

        )

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['email'] = user.email
        token['is_verified'] = user.is_verified
        # ...

        return token
    


class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ['follower', 'followed', 'created_at']
