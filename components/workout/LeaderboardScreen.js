import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AnimatedBackground from './common/AnimatedBackground';
import { styles as appStyles } from '../styles/AppStyles';
import { responsivePadding, fonts, spacing, scaleWidth, scaleHeight } from '../utils/responsive';

const LeaderboardScreen = ({ user, onBack, styles = appStyles }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    fetchLeaderboard();
    fetchUserRanking();
    fetchUserStreak();
  }, [user]);

  const fetchUserRanking = async () => {
    try {
      const { supabase } = await import('../supabaseConfig');
      
      // Get all users' current streaks and rank them
      const { data: allStreaks, error } = await supabase
        .from('user_streaks')
        .select('user_id, current_streak')
        .order('current_streak', { ascending: false });
      
      if (error) {
        console.error('Error fetching user rankings:', error);
        return;
      }
      
      // Find current user's rank
      const userIndex = allStreaks.findIndex(streak => streak.user_id === user.id);
      const rank = userIndex + 1; // Rank starts from 1
      
      setUserRank(rank);
      setTotalUsers(allStreaks.length);
    } catch (error) {
      console.error('Error in fetchUserRanking:', error);
    }
  };

  const fetchUserStreak = async () => {
    try {
      const { supabase } = await import('../supabaseConfig');
      const { data, error } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user streak:', error);
        return;
      }
      
      if (data) {
        setCurrentStreak(data.current_streak);
      }
    } catch (error) {
      console.error('Error in fetchUserStreak:', error);
    }
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const { supabase } = await import('../supabaseConfig');
      
      // Get all users by current streak with their profile data
      const { data: allStreaks, error } = await supabase
        .from('user_streaks')
        .select(`
          current_streak,
          total_workouts,
          longest_streak,
          last_workout_date,
          user_id
        `)
        .order('current_streak', { ascending: false })
        .order('total_workouts', { ascending: false }); // Secondary sort by total workouts
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      // Create a user profile lookup from authenticated user and generate display names
      const formattedData = allStreaks.map((item, index) => {
        // For the current user, we have their data
        if (item.user_id === user.id) {
          const firstName = user?.user_metadata?.first_name;
          const email = user?.email;
          const displayName = firstName || email?.split('@')[0] || 'You';
          
          return {
            rank: index + 1,
            name: displayName,
            email: email,
            streak: item.current_streak,
            workouts: item.total_workouts,
            longestStreak: item.longest_streak,
            lastWorkout: item.last_workout_date,
            user_id: item.user_id,
            isCurrentUser: true,
            avatar: firstName?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || 'Y'
          };
        } else {
          // For other users, generate anonymous display names
          const anonymousNames = [
            'Fitness Pro', 'Gym Warrior', 'Health Hero', 'Workout King', 'Fit Master',
            'Strong Athlete', 'Power Lifter', 'Cardio Queen', 'Muscle Builder', 'Training Expert',
            'Fitness Guru', 'Strength Star', 'Active Champion', 'Wellness Pro', 'Fit Legend'
          ];
          
          // Use user_id to generate consistent anonymous name
          const nameIndex = item.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % anonymousNames.length;
          const displayName = anonymousNames[nameIndex];
          const avatar = displayName.split(' ').map(word => word[0]).join('');
          
          return {
            rank: index + 1,
            name: displayName,
            email: 'hidden',
            streak: item.current_streak,
            workouts: item.total_workouts,
            longestStreak: item.longest_streak,
            lastWorkout: item.last_workout_date,
            user_id: item.user_id,
            isCurrentUser: false,
            avatar: avatar
          };
        }
      });

      setLeaderboardData(formattedData);
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const formatLastWorkout = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#1A1A1A';
  };

  return (
    <SafeAreaView style={styles?.dashboardContainer || { flex: 1, backgroundColor: '#FFFFFF' }}>
      <AnimatedBackground />
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          paddingTop: spacing.lg,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0, 0, 0, 0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <TouchableOpacity 
            style={{
              padding: spacing.xs,
              marginRight: spacing.sm,
              borderRadius: scaleWidth(20),
              backgroundColor: 'rgba(74, 158, 255, 0.1)'
            }}
            onPress={onBack}
          >
            <Text style={{ fontSize: fonts.large, color: '#4A9EFF' }}>←</Text>
          </TouchableOpacity>
          <Text style={{ 
            fontSize: fonts.title, 
            fontWeight: 'bold', 
            color: '#1A1A1A',
            flex: 1
          }}>
            Global Leaderboard
          </Text>
        </View>

        <ScrollView style={{ flex: 1, backgroundColor: '#F5F5F7' }}>
          {/* Top Section with Podium - Similar to your reference */}
          {leaderboardData.length >= 3 && (
            <View style={{ 
              backgroundColor: '#FFFFFF',
              paddingTop: spacing.lg,
              paddingBottom: spacing.xl,
              marginBottom: spacing.sm
            }}>
              {/* Header */}
              <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.lg }}>
                <Text style={{ 
                  fontSize: fonts.title, 
                  fontWeight: 'bold', 
                  color: '#1A1A1A',
                  textAlign: 'center',
                  marginBottom: spacing.xs
                }}>
                  Leaderboard
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
                  <View style={{ 
                    backgroundColor: '#E3F2FD', 
                    paddingHorizontal: spacing.sm, 
                    paddingVertical: spacing.xs, 
                    borderRadius: scaleWidth(12) 
                  }}>
                    <Text style={{ fontSize: fonts.small, color: '#1976D2', fontWeight: '600' }}>Worldwide</Text>
                  </View>
                  <View style={{ 
                    backgroundColor: '#F0F0F0', 
                    paddingHorizontal: spacing.sm, 
                    paddingVertical: spacing.xs, 
                    borderRadius: scaleWidth(12) 
                  }}>
                    <Text style={{ fontSize: fonts.small, color: '#6C757D', fontWeight: '600' }}>United States</Text>
                  </View>
                  <View style={{ 
                    backgroundColor: '#F0F0F0', 
                    paddingHorizontal: spacing.sm, 
                    paddingVertical: spacing.xs, 
                    borderRadius: scaleWidth(12) 
                  }}>
                    <Text style={{ fontSize: fonts.small, color: '#6C757D', fontWeight: '600' }}>Florida</Text>
                  </View>
                </View>
              </View>

              {/* Podium Section */}
              <View style={{ alignItems: 'center', paddingHorizontal: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.lg }}>
                  {/* 2nd Place */}
                  {leaderboardData[1] && (
                    <View style={{ alignItems: 'center', marginHorizontal: spacing.sm }}>
                      <View style={{ position: 'relative', marginBottom: spacing.sm }}>
                        <View style={{
                          width: scaleWidth(65),
                          height: scaleWidth(65),
                          borderRadius: scaleWidth(32.5),
                          backgroundColor: leaderboardData[1].isCurrentUser ? '#4A9EFF' : '#007AFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 3,
                          borderColor: '#C0C0C0'
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: fonts.large, fontWeight: 'bold' }}>
                            {leaderboardData[1].avatar}
                          </Text>
                        </View>
                        <View style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: '#C0C0C0',
                          borderRadius: scaleWidth(12),
                          width: scaleWidth(24),
                          height: scaleWidth(24),
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: fonts.small, fontWeight: 'bold' }}>2</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: fonts.small, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center' }}>
                        {leaderboardData[1].name.length > 10 ? leaderboardData[1].name.substring(0, 10) + '...' : leaderboardData[1].name}
                      </Text>
                      <Text style={{ fontSize: fonts.medium, fontWeight: 'bold', color: '#FF6B35' }}>
                        {leaderboardData[1].streak}
                      </Text>
                      {/* Podium Base */}
                      <View style={{
                        width: scaleWidth(60),
                        height: scaleWidth(40),
                        backgroundColor: '#E8E8E8',
                        marginTop: spacing.xs,
                        borderTopLeftRadius: scaleWidth(8),
                        borderTopRightRadius: scaleWidth(8),
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Text style={{ fontSize: fonts.title, fontWeight: 'bold', color: '#C0C0C0' }}>2</Text>
                      </View>
                    </View>
                  )}

                  {/* 1st Place */}
                  {leaderboardData[0] && (
                    <View style={{ alignItems: 'center', marginHorizontal: spacing.sm }}>
                      <View style={{ position: 'relative', marginBottom: spacing.sm }}>
                        <View style={{
                          width: scaleWidth(80),
                          height: scaleWidth(80),
                          borderRadius: scaleWidth(40),
                          backgroundColor: leaderboardData[0].isCurrentUser ? '#4A9EFF' : '#007AFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 3,
                          borderColor: '#FFD700'
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: fonts.title, fontWeight: 'bold' }}>
                            {leaderboardData[0].avatar}
                          </Text>
                        </View>
                        <View style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: '#FFD700',
                          borderRadius: scaleWidth(12),
                          width: scaleWidth(24),
                          height: scaleWidth(24),
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: fonts.small, fontWeight: 'bold' }}>1</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: fonts.medium, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center' }}>
                        {leaderboardData[0].name.length > 10 ? leaderboardData[0].name.substring(0, 10) + '...' : leaderboardData[0].name}
                      </Text>
                      <Text style={{ fontSize: fonts.large, fontWeight: 'bold', color: '#FF6B35' }}>
                        {leaderboardData[0].streak}
                      </Text>
                      {/* Podium Base */}
                      <View style={{
                        width: scaleWidth(70),
                        height: scaleWidth(60),
                        backgroundColor: '#FFD700',
                        marginTop: spacing.xs,
                        borderTopLeftRadius: scaleWidth(8),
                        borderTopRightRadius: scaleWidth(8),
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Text style={{ fontSize: fonts.title * 1.2, fontWeight: 'bold', color: '#FFFFFF' }}>1</Text>
                      </View>
                    </View>
                  )}

                  {/* 3rd Place */}
                  {leaderboardData[2] && (
                    <View style={{ alignItems: 'center', marginHorizontal: spacing.sm }}>
                      <View style={{ position: 'relative', marginBottom: spacing.sm }}>
                        <View style={{
                          width: scaleWidth(65),
                          height: scaleWidth(65),
                          borderRadius: scaleWidth(32.5),
                          backgroundColor: leaderboardData[2].isCurrentUser ? '#4A9EFF' : '#007AFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 3,
                          borderColor: '#CD7F32'
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: fonts.large, fontWeight: 'bold' }}>
                            {leaderboardData[2].avatar}
                          </Text>
                        </View>
                        <View style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: '#CD7F32',
                          borderRadius: scaleWidth(12),
                          width: scaleWidth(24),
                          height: scaleWidth(24),
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: fonts.small, fontWeight: 'bold' }}>3</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: fonts.small, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center' }}>
                        {leaderboardData[2].name.length > 10 ? leaderboardData[2].name.substring(0, 10) + '...' : leaderboardData[2].name}
                      </Text>
                      <Text style={{ fontSize: fonts.medium, fontWeight: 'bold', color: '#FF6B35' }}>
                        {leaderboardData[2].streak}
                      </Text>
                      {/* Podium Base */}
                      <View style={{
                        width: scaleWidth(60),
                        height: scaleWidth(30),
                        backgroundColor: '#DEB887',
                        marginTop: spacing.xs,
                        borderTopLeftRadius: scaleWidth(8),
                        borderTopRightRadius: scaleWidth(8),
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Text style={{ fontSize: fonts.title, fontWeight: 'bold', color: '#CD7F32' }}>3</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* All Users List - Card Style like Reference */}
          <View style={{ paddingHorizontal: spacing.md }}>
            {leaderboardLoading ? (
              <View style={{ 
                backgroundColor: '#FFFFFF',
                borderRadius: scaleWidth(16),
                padding: spacing.xl,
                alignItems: 'center',
                marginBottom: spacing.md
              }}>
                <Text style={{ color: '#6C757D', fontSize: fonts.medium }}>Loading...</Text>
              </View>
            ) : leaderboardData.length === 0 ? (
              <View style={{ 
                backgroundColor: '#FFFFFF',
                borderRadius: scaleWidth(16),
                padding: spacing.xl,
                alignItems: 'center',
                marginBottom: spacing.md
              }}>
                <Text style={{ color: '#6C757D', fontSize: fonts.medium }}>No users found</Text>
              </View>
            ) : (
              leaderboardData.map((item, index) => (
                <View key={item.user_id} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: scaleWidth(16),
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                  borderWidth: item.isCurrentUser ? 2 : 0,
                  borderColor: item.isCurrentUser ? '#4A9EFF' : 'transparent'
                }}>
                  {/* Rank */}
                  <View style={{ 
                    minWidth: scaleWidth(35),
                    alignItems: 'center',
                    marginRight: spacing.sm
                  }}>
                    <Text style={{
                      fontSize: fonts.large,
                      fontWeight: 'bold',
                      color: getRankColor(item.rank)
                    }}>
                      {item.rank}
                    </Text>
                  </View>

                  {/* Avatar */}
                  <View style={{ position: 'relative', marginRight: spacing.md }}>
                    <View style={{
                      width: scaleWidth(50),
                      height: scaleWidth(50),
                      borderRadius: scaleWidth(25),
                      backgroundColor: item.isCurrentUser ? '#4A9EFF' : '#007AFF',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text style={{ color: '#FFFFFF', fontSize: fonts.medium, fontWeight: 'bold' }}>
                        {item.avatar}
                      </Text>
                    </View>
                    {/* Rank badge for top 3 */}
                    {item.rank <= 3 && (
                      <View style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        backgroundColor: item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32',
                        borderRadius: scaleWidth(10),
                        width: scaleWidth(20),
                        height: scaleWidth(20),
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Text style={{ 
                          color: '#FFFFFF', 
                          fontSize: 10, 
                          fontWeight: 'bold' 
                        }}>
                          {item.rank}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* User Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={{ 
                        fontSize: fonts.medium, 
                        fontWeight: '600', 
                        color: '#1A1A1A',
                        marginRight: spacing.xs
                      }}>
                        {item.name}
                      </Text>
                      {item.isCurrentUser && (
                        <View style={{
                          backgroundColor: '#4A9EFF',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 8
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>YOU</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: fonts.small, color: '#8E8E93' }}>
                      {item.workouts} workouts • {formatLastWorkout(item.lastWorkout)}
                    </Text>
                  </View>

                  {/* Streak */}
                  <View style={{ alignItems: 'center', minWidth: scaleWidth(50) }}>
                    <View style={{
                      backgroundColor: item.streak > 0 ? 'rgba(255, 107, 53, 0.1)' : 'rgba(142, 142, 147, 0.1)',
                      borderRadius: scaleWidth(12),
                      paddingHorizontal: spacing.xs,
                      paddingVertical: 4,
                      alignItems: 'center',
                      minWidth: scaleWidth(40)
                    }}>
                      <Text style={{ 
                        fontSize: fonts.medium, 
                        fontWeight: 'bold', 
                        color: item.streak > 0 ? '#FF6B35' : '#8E8E93'
                      }}>
                        {item.streak}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Your Position Summary at Bottom */}
          <View style={{ 
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.lg
          }}>
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: scaleWidth(16),
              padding: spacing.md,
              borderLeftWidth: 4,
              borderLeftColor: userRank <= 3 ? '#FFD700' : '#4A9EFF'
            }}>
              <Text style={{ 
                fontSize: fonts.small, 
                color: userRank <= 3 ? '#F59E0B' : '#1976D2', 
                fontWeight: '600', 
                marginBottom: spacing.xs 
              }}>
                Your Position
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: fonts.title, fontWeight: 'bold', color: getRankColor(userRank) }}>
                    #{userRank || 'N/A'}
                  </Text>
                  <Text style={{ fontSize: fonts.small, color: '#6C757D', marginTop: 2 }}>
                    Out of {totalUsers} users
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    borderRadius: scaleWidth(12),
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    alignItems: 'center'
                  }}>
                    <Text style={{ fontSize: fonts.large, fontWeight: 'bold', color: '#FF6B35' }}>
                      {currentStreak}
                    </Text>
                    <Text style={{ fontSize: fonts.small, color: '#6C757D' }}>
                      Day{currentStreak !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default LeaderboardScreen;
