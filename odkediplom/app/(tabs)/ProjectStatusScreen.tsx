import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, Alert, Dimensions, TouchableOpacity,
  Modal, FlatList, Platform, StatusBar,
} from 'react-native';
import axios from 'axios';
import { useApp } from '@/contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');
const BASE_URL = "http://192.168.144.53:8000";
const MONTH_NAMES = [
  "Нэгдүгээр", "Хоёрдугаар", "Гуравдугаар", "Дөрөвдүгээр",
  "Тавдугаар", "Зургаадугаар", "Долдугаар", "Наймдугаар",
  "Есдүгээр", "Аравдугаар", "Арван нэгдүгээр", "Арван хоёрдугаар",
];
const MONTH_NAMES_EN = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function ProjectStatusScreen() {
  const { token } = useApp() as any;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('month');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async (p = period, m = month) => {
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/hr/report/summary/`, {
        params: { period: p, month: m, year: new Date().getFullYear() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (e) {
      Alert.alert("Алдаа", "Мэдээлэл татахад алдаа гарлаа.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, period, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownloadPDF = async () => {
    if (!data) return;
    const htmlContent = `
      <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        html,body{margin:0;padding:0;background:#F8FAFC;font-family:Helvetica,sans-serif}
        body{padding:40px 20px}
        @page{size:A4;margin:10mm}
        .header{text-align:center;margin-bottom:30px;border-bottom:2px solid #6366F1;padding-bottom:20px}
        .header h1{margin:0;color:#111827;font-size:24px}
        .header p{color:#6B7280;margin:5px 0 0}
        .stat-row{display:flex;justify-content:space-between;margin-bottom:30px;gap:10px}
        .stat-card{flex:1;background:white;padding:15px;border-radius:15px;border-left:5px solid #6366F1;text-align:center}
        .stat-label{font-size:10px;color:#64748B;text-transform:uppercase;font-weight:bold}
        .stat-val{font-size:20px;font-weight:bold;color:#1E293B;margin-top:5px}
        .section-title{font-size:18px;font-weight:bold;color:#1E293B;margin:25px 0 15px}
        .item-card{background:white;border-radius:18px;padding:20px;margin-bottom:15px;page-break-inside:avoid;break-inside:avoid}
        .item-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .item-name{font-weight:bold;color:#1E293B;font-size:16px}
        .item-sub{font-size:12px;color:#64748B}
        .item-percent{font-weight:800;color:#4F46E5}
        .progress-bg{height:8px;background:#F1F5F9;border-radius:4px;overflow:hidden}
        .progress-fill{height:100%;border-radius:4px}
        .footer{margin-top:50px;text-align:center;font-size:11px;color:#9CA3AF;border-top:1px solid #E2E8F0;padding-top:20px}
      </style></head><body>
      <div class="header"><h1>ХЯНАЛТЫН САМБАРЫН ТАЙЛАН</h1><p>${MONTH_NAMES_EN[month-1]} ${new Date().getFullYear()}</p></div>
      <div class="stat-row">
        <div class="stat-card" style="border-left-color:#F59E0B"><div class="stat-label">Хоцролт</div><div class="stat-val">${data?.late_count||0}</div></div>
        <div class="stat-card" style="border-left-color:#10B981"><div class="stat-label">Чөлөө</div><div class="stat-val">0</div></div>
        <div class="stat-card" style="border-left-color:#3B82F6"><div class="stat-label">Томилолт</div><div class="stat-val">0</div></div>
      </div>
      <div class="section-title">Хэлтсүүдийн явц</div>
      ${(data?.department_progress||[]).map((item:any)=>`
        <div class="item-card">
          <div class="item-header">
            <div><div class="item-name">${item.name}</div><div class="item-sub">${item.staff_count} ажилтан</div></div>
            <div class="item-percent">${item.value}%</div>
          </div>
          <div class="progress-bg"><div class="progress-fill" style="width:${item.value}%;background:#4F46E5"></div></div>
        </div>`).join('')}
      <div class="section-title">Төслүүдийн явц</div>
      ${(data?.projects||[]).map((proj:any)=>`
        <div class="item-card">
          <div class="item-header">
            <div><div class="item-name">${proj.name}</div><div class="item-sub">${proj.stats.done} дууссан</div></div>
            <div class="item-percent" style="color:#0EA5E9">${proj.percent}%</div>
          </div>
          <div class="progress-bg"><div class="progress-fill" style="width:${proj.percent}%;background:#0EA5E9"></div></div>
        </div>`).join('')}
      <div class="footer">Үүсгэсэн: ${new Date().toLocaleString()}<br/>© ${new Date().getFullYear()} E-Office Mobile App v1.0</div>
      </body></html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri; link.download = `Report_${MONTH_NAMES_EN[month-1]}.pdf`; link.click();
      } else {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch { Alert.alert("Алдаа", "PDF файл үүсгэхэд алдаа гарлаа."); }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const attendanceRate = data?.summary?.attendance_rate ?? 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#6366F1" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.topSub}>{new Date().getFullYear()} оны</Text>
            <Text style={styles.topTitle}>Хяналтын самбар</Text>
          </View>
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadPDF}>
            <Ionicons name="cloud-download-outline" size={20} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* Period tabs */}
        <View style={styles.tabWrap}>
          {[
            { key: 'day', label: 'Өнөөдөр' },
            { key: 'week', label: '7 хоног' },
            { key: 'month', label: 'Сар' },
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, period === t.key && styles.tabActive]}
              onPress={() => { setPeriod(t.key); setLoading(true); fetchData(t.key); }}
            >
              <Text style={[styles.tabText, period === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {period === 'month' && (
          <TouchableOpacity style={styles.monthPicker} onPress={() => setShowModal(true)}>
            <Ionicons name="calendar-outline" size={15} color="#6366F1" />
            <Text style={styles.monthPickerText}>{MONTH_NAMES[month - 1]} сар</Text>
            <Ionicons name="chevron-down" size={14} color="#6366F1" />
          </TouchableOpacity>
        )}

        {/* Top 3 mini cards */}
        <View style={styles.miniRow}>
          <MiniCard icon="time-outline" label="Хоцролт" val={data?.late_count} color="#F59E0B" bg="#FFFBEB" />
          <MiniCard icon="leaf-outline" label="Чөлөө" val={0} color="#10B981" bg="#ECFDF5" />
          <MiniCard icon="briefcase-outline" label="Томилолт" val={0} color="#3B82F6" bg="#EFF6FF" />
        </View>

        {/* Attendance main card */}
        <LinearGradient colors={['#4F46E5', '#6366F1', '#818CF8']} style={styles.mainCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.mainCardDeco} />
          <Text style={styles.mainCardTitle}>Нийт ирцийн биелэлт</Text>
          <View style={styles.mainCardBody}>
            <View style={styles.circleWrap}>
              <Text style={styles.circleVal}>{attendanceRate}%</Text>
            </View>
            <View style={styles.mainCardStats}>
              <View style={styles.mainCardStat}>
                <View style={[styles.mainCardDot, { backgroundColor: '#34D399' }]} />
                <Text style={styles.mainCardStatText}>Ирсэн: <Text style={{ fontWeight: '800' }}>{data?.summary?.present_today ?? '—'}</Text></Text>
              </View>
              <View style={styles.mainCardStat}>
                <View style={[styles.mainCardDot, { backgroundColor: '#FDA4AF' }]} />
                <Text style={styles.mainCardStatText}>Ирээгүй: <Text style={{ fontWeight: '800' }}>{data?.summary?.absent_today ?? '—'}</Text></Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Departments */}
        <SectionHeader title="Хэлтсүүдийн явц" icon="business-outline" />
        {(data?.department_progress || []).map((item: any, i: number) => (
          <ProgressItem
            key={i}
            icon="business-outline"
            iconColor="#6366F1"
            iconBg="#EEF2FF"
            name={item.name}
            sub={`${item.staff_count} ажилтан`}
            percent={item.value}
            barColor="#6366F1"
          />
        ))}

        {/* Projects */}
        <SectionHeader title="Төслүүдийн явц" icon="rocket-outline" style={{ marginTop: 8 }} />
        {(data?.projects || []).map((proj: any, i: number) => (
          <ProgressItem
            key={i}
            icon="rocket-outline"
            iconColor="#0EA5E9"
            iconBg="#F0F9FF"
            name={proj.name}
            sub={`${proj.stats.done} дууссан`}
            percent={proj.percent}
            barColor="#0EA5E9"
          />
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Month modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Сар сонгох</Text>
            <FlatList
              data={MONTH_NAMES}
              keyExtractor={item => item}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[styles.monthItem, month === index + 1 && styles.monthItemActive]}
                  onPress={() => { setMonth(index + 1); setShowModal(false); setLoading(true); fetchData(period, index + 1); }}
                >
                  <Text style={[styles.monthItemText, month === index + 1 && styles.monthItemTextActive]}>
                    {item} сар
                  </Text>
                  {month === index + 1 && <Ionicons name="checkmark-circle" size={18} color="#6366F1" />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowModal(false)}>
              <Text style={styles.modalCloseText}>Хаах</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionHeader({ title, icon, style }: any) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 4 }, style]}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={16} color="#6366F1" />
      </View>
      <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>{title}</Text>
    </View>
  );
}

function ProgressItem({ icon, iconColor, iconBg, name, sub, percent, barColor }: any) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressCardHeader}>
        <View style={[styles.progressIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.progressName}>{name}</Text>
          <Text style={styles.progressSub}>{sub}</Text>
        </View>
        <Text style={[styles.progressPct, { color: iconColor }]}>{percent}%</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${percent}%` as any, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

function MiniCard({ icon, label, val, color, bg }: any) {
  return (
    <View style={[styles.miniCard, { borderTopColor: color }]}>
      <View style={[styles.miniIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.miniVal, { color }]}>{val ?? 0}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 18, paddingBottom: 40 },

  topHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginTop: Platform.OS === 'ios' ? 60 : 44, marginBottom: 20,
  },
  topSub: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  topTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  downloadBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: '#F1F5F9',
  },

  tabWrap: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 16, padding: 4, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 13 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  tabText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#6366F1', fontWeight: '700' },

  monthPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: '#EEF2FF', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, marginBottom: 16,
  },
  monthPickerText: { color: '#6366F1', fontWeight: '700', fontSize: 14 },

  miniRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  miniCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14,
    alignItems: 'center', borderTopWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  miniIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  miniVal: { fontSize: 22, fontWeight: '800' },
  miniLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2 },

  mainCard: {
    borderRadius: 28, padding: 24, marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  mainCardDeco: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -50, right: -40,
  },
  mainCardTitle: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontSize: 14, marginBottom: 18 },
  mainCardBody: { flexDirection: 'row', alignItems: 'center' },
  circleWrap: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 6, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  circleVal: { color: '#fff', fontWeight: '900', fontSize: 20 },
  mainCardStats: { flex: 1, marginLeft: 24, gap: 12 },
  mainCardStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mainCardDot: { width: 8, height: 8, borderRadius: 4 },
  mainCardStatText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },

  progressCard: {
    backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  progressCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  progressIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  progressName: { fontWeight: '700', fontSize: 15, color: '#0F172A' },
  progressSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  progressPct: { fontWeight: '800', fontSize: 18 },
  barBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, maxHeight: '70%',
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', color: '#0F172A', marginBottom: 16 },
  monthItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  monthItemActive: { backgroundColor: '#F5F3FF', borderRadius: 12, paddingHorizontal: 12 },
  monthItemText: { fontSize: 16, color: '#475569' },
  monthItemTextActive: { color: '#6366F1', fontWeight: '700' },
  modalClose: { marginTop: 20, backgroundColor: '#0F172A', padding: 16, borderRadius: 18, alignItems: 'center' },
  modalCloseText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
