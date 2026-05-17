import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

const adminActions = [
  {
    title: 'Байгууллагын тохиргоо',
    icon: 'business-outline',
    route: '/(tabs)/EditOrganizationScreen',
    colors: ['#6366F1', '#4F46E5'],
    accent: '#818CF8',
  },
  {
    title: 'Төсөл эхлүүлэх',
    icon: 'rocket-outline',
    route: '/(tabs)/CreateProjectScreen',
    colors: ['#059669', '#10B981'],
    accent: '#34D399',
  },
  {
    title: 'Гишүүд удирдах',
    icon: 'people-circle-outline',
    route: '/(tabs)/ManageMembersScreen',
    colors: ['#D97706', '#F59E0B'],
    accent: '#FCD34D',
  },
  {
    title: 'Ирц бүртгэл',
    icon: 'calendar-outline',
    route: '/(tabs)/AttendanceListScreen',
    colors: ['#0284C7', '#0EA5E9'],
    accent: '#38BDF8',
  },
  {
    title: 'Дэлгэц (Kiosk)',
    icon: 'tv-outline',
    route: '/(tabs)/RegisterDisplayScreen',
    colors: ['#BE185D', '#EC4899'],
    accent: '#F9A8D4',
  },
  {
    title: 'Ажлын явц',
    icon: 'document-text-outline',
    route: '/(tabs)/ProjectStatusScreen',
    colors: ['#374151', '#1F2937'],
    accent: '#9CA3AF',
  },
];

export default function OrganizationManagementScreen() {
  const router = useRouter();
  const { user } = useApp() as any;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Dark gradient header */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.headerSub}>Удирдлагын</Text>
            <Text style={styles.headerTitle}>Төв</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/(tabs)/EditOrganizationScreen')}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Welcome strip */}
        <View style={styles.welcomeStrip}>
          <View style={styles.welcomeAvatar}>
            <Text style={styles.welcomeAvatarText}>
              {user?.first_name?.[0]?.toUpperCase() || 'А'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeGreet}>Сайн байна уу,</Text>
            <Text style={styles.welcomeName}>{user?.first_name || 'Админ'}</Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#6366F1" />
            <Text style={styles.adminBadgeText}>Админ</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.gridLabel}>Үйлдлүүд</Text>

        <View style={styles.grid}>
          {adminActions.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.88}
              style={styles.cardWrap}
            >
              <LinearGradient
                colors={item.colors as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                {/* Decorative circle */}
                <View style={styles.cardDeco} />

                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon as any} size={26} color="#fff" />
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>

                <View style={styles.cardArrowWrap}>
                  <Ionicons name="arrow-forward" size={14} color={item.accent} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Invite section */}
        <View style={styles.inviteCard}>
          <View style={styles.inviteLeft}>
            <View style={styles.inviteIconWrap}>
              <Ionicons name="person-add-outline" size={22} color="#6366F1" />
            </View>
            <View>
              <Text style={styles.inviteTitle}>Шинэ ажилтан урих</Text>
              <Text style={styles.inviteSub}>Урилга и-мэйлээр илгээнэ</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.inviteBtn}
            onPress={() => router.push('/(tabs)/InviteMemberScreen')}
            activeOpacity={0.85}
          >
            <Text style={styles.inviteBtnText}>Урих</Text>
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },

  /* Header */
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 22,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerSub: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#F1F5F9', letterSpacing: -1 },
  settingsBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  welcomeStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  welcomeAvatar: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
  },
  welcomeAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  welcomeGreet: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  welcomeName: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)',
  },
  adminBadgeText: { fontSize: 11, color: '#818CF8', fontWeight: '700' },

  /* Grid */
  scrollContent: { paddingHorizontal: 16, paddingTop: 24 },
  gridLabel: {
    fontSize: 13, fontWeight: '700', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  cardWrap: {
    width: CARD_WIDTH,
    borderRadius: 24,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  card: {
    borderRadius: 24, padding: 18,
    height: CARD_WIDTH * 1.1,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardDeco: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -30, right: -30,
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#fff', lineHeight: 18 },
  cardArrowWrap: {
    alignSelf: 'flex-end',
    width: 28, height: 28, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* Invite */
  inviteCard: {
    backgroundColor: '#fff', borderRadius: 22, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  inviteLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  inviteIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  inviteTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  inviteSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#6366F1', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  inviteBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
