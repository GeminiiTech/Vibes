from django.urls import path
from .views import RegisterUserView, MyTokenObtainPairView, FollowUserView,UnfollowUserView,FollowStatusView,ProfileView,FollowersListView,FollowingListView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', MyTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/<int:user_id>/', ProfileView.as_view(), name='profiles'),

    path('follow/', FollowUserView.as_view(), name='follow'),
    path('unfollow/', UnfollowUserView.as_view(), name='unfollow'),
    path('status/', FollowStatusView.as_view(), name='status'),

    path("followers/", FollowersListView.as_view(), name="followers-list"),
    path("following/", FollowingListView.as_view(), name="following-list"),

    
]