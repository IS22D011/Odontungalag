import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    StyleSheet, 
    ActivityIndicator, 
    RefreshControl,
    SafeAreaView,
    Platform,
    StatusBar,
    TouchableOpacity,
    Alert
} from 'react-native';
import { useApp } from "@/contexts/AppContext";
import { 
    Clock, User, AlertCircle, CheckCircle2, 
    Timer, Calendar as CalendarIcon, Check, X 
} from "lucide-react-native";
import { Stack } from "expo-router";
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';

LocaleConfig.locales['mn'] = {
    monthNames: ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар','7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'],
    monthNamesShort: ['1.','2.','3.','4.','5.','6.','7.','8.','9.','10.','11.','12.'],
    dayNames: ['Ням','Даваа','Мягмар','Лхагва','Пүрэв','Баасан','Бямба'],
    dayNamesShort: ['Ня','Да','Мя','Лх','Пү','Ба','Бя'],
    today: 'Өнөөдөр'
};
LocaleConfig.defaultLocale = 'mn';

const API_BASE = "http://192.168.144.53:8000/api";

export default function AttendanceListScreen() {
    const { token } = useApp() as any;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'attendance' | 'leave'>('attendance');
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // --- Ирцийн мэдээлэл татах ---
    const fetchAttendance = useCallback(async (date: string) => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/hr/detailed-attendance/?date=${date}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAttendanceData(data);
            }
        } catch (error) {
            console.error("Attendance Fetch Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    // --- Чөлөөний хүсэлт татах ---
    const fetchLeaves = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE}/hr/leaves/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLeaveRequests(data);
            }
        } catch (error) {
            console.error("Leaves Fetch Error:", error);
        }
    }, [token]);

    useEffect(() => {
        // Аль ч Tab дээр байсан чөлөөний өгөгдлийг урьдчилж татсан байх шаардлагатай
        fetchLeaves();
        if (activeTab === 'attendance') fetchAttendance(selectedDate);
    }, [selectedDate, activeTab, fetchAttendance, fetchLeaves]);

    // --- Сонгосон өдөр ажилтан чөлөөтэй эсэхийг шалгах логик ---
    const checkUserIsOnLeave = (userName: string, dateStr: string) => {
        const checkDate = new Date(dateStr);
        checkDate.setHours(0, 0, 0, 0);

        return leaveRequests.find((leave: any) => {
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            return (
                leave.status === 'approved' && 
                leave.user_name === userName && 
                checkDate >= start && 
                checkDate <= end
            );
        });
    };

    const handleLeaveAction = async (id: number, status: 'approved' | 'rejected') => {
        try {
            const response = await fetch(`${API_BASE}/hr/leaves/${id}/approve/`, {
                method: 'POST',
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                Alert.alert("Амжилттай", status === 'approved' ? "Чөлөөг баталлаа" : "Чөлөөг цуцаллаа");
                fetchLeaves();
                if (activeTab === 'attendance') fetchAttendance(selectedDate);
            }
        } catch (error) {
            Alert.alert("Алдаа", "Үйлдэл амжилтгүй боллоо");
        }
    };

    const getStatusStyle = (status: string, isOnLeave: boolean) => {
        if (isOnLeave) return { label: 'Чөлөөтэй', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.2)' };
        
        switch (status) {
            case 'present': case 'approved':
                return { label: 'Ирсэн', color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' };
            case 'late': case 'pending':
                return { label: 'Хоцорсон', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)' };
            case 'absent': case 'rejected':
                return { label: 'Тасалсан', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' };
            default:
                return { label: 'Тодорхойгүй', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.2)' };
        }
    };

    // --- Ирцийн Card ---
    const renderAttendanceItem = ({ item }: any) => {
        const approvedLeave = checkUserIsOnLeave(item.user_name, selectedDate);
        const isOnLeave = !!approvedLeave;
        const style = getStatusStyle(item.status, isOnLeave);

        return (
            <View style={styles.glassCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.userInfo}>
                        <LinearGradient 
                            colors={isOnLeave ? ['#4F46E5', '#818CF8'] : ['#6366F1', '#A855F7']} 
                            style={styles.avatarGradient}
                        >
                            <User size={18} color="#fff" />
                        </LinearGradient>
                        <View>
                            <Text style={styles.userName}>{item.user_name}</Text>
                            <Text style={styles.dateLabel}>{selectedDate}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
                        <Text style={[styles.statusText, { color: style.color }]}>{style.label}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    {isOnLeave ? (
                        <View style={styles.timeBox}>
                            <CheckCircle2 size={14} color="#6366F1" />
                            <Text style={[styles.timeValue, {color: '#818CF8', fontWeight: '600'}]}>
                                Батлагдсан чөлөөтэй: {approvedLeave.reason}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.timeBox}>
                                <Clock size={14} color="#94A3B8" />
                                <Text style={styles.timeValue}>Ирсэн: {item.check_in || '--:--'}</Text>
                            </View>
                            <View style={styles.timeBox}>
                                <Clock size={14} color="#94A3B8" />
                                <Text style={styles.timeValue}>Гарсан: {item.check_out || '--:--'}</Text>
                            </View>
                        </>
                    )}
                </View>

                {!isOnLeave && (
                    <View style={styles.cardFooter}>
                        <View style={styles.totalHoursBadge}>
                            <Timer size={14} color="#A855F7" />
                            <Text style={styles.totalHoursText}>Нийт: {item.total_hours || '0'} ч</Text>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    // --- Чөлөөний Card ---
    const renderLeaveItem = ({ item }: any) => {
        const style = getStatusStyle(item.status, false);
        return (
            <View style={styles.glassCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.userInfo}>
                        <View style={[styles.avatarGradient, {backgroundColor: '#334155'}]}>
                            <User size={18} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.userName}>{item.user_name}</Text>
                            <Text style={styles.dateLabel}>{item.start_date} - {item.end_date}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
                        <Text style={[styles.statusText, { color: style.color }]}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.reasonText} numberOfLines={2}>Шалтгаан: {item.reason}</Text>
                
                {item.status === 'pending' && (
                    <View style={styles.leaveActionRow}>
                        <TouchableOpacity style={[styles.miniBtn, styles.rejectBtn]} onPress={() => handleLeaveAction(item.id, 'rejected')}>
                            <X size={16} color="#EF4444" /><Text style={styles.rejectBtnText}>Татгалзах</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.miniBtn, styles.approveBtn]} onPress={() => handleLeaveAction(item.id, 'approved')}>
                            <Check size={16} color="#10B981" /><Text style={styles.approveBtnText}>Зөвшөөрөх</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0F172A', '#1E1B4B', '#2E1065']} style={StyleSheet.absoluteFill} />
            
            <SafeAreaView style={{ flex: 1 }}>
                <Stack.Screen options={{ headerShown: true, headerTransparent: true, headerTitle: "HR Удирдах", headerTintColor: '#fff' }} />

                <View style={styles.tabWrapper}>
                    <TouchableOpacity 
                        style={[styles.tabBtn, activeTab === 'attendance' && styles.activeTab]}
                        onPress={() => setActiveTab('attendance')}
                    >
                        <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>Ирцийн бүртгэл</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabBtn, activeTab === 'leave' && styles.activeTab]}
                        onPress={() => setActiveTab('leave')}
                    >
                        <Text style={[styles.tabText, activeTab === 'leave' && styles.activeTabText]}>Чөлөөний хүсэлт</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'attendance' && (
                    <View style={styles.calendarContainer}>
                        <Calendar
                            onDayPress={(day: any) => setSelectedDate(day.dateString)}
                            markedDates={{ [selectedDate]: { selected: true, selectedColor: '#7C3AED' } }}
                            theme={{
                                backgroundColor: 'transparent', calendarBackground: 'transparent',
                                textSectionTitleColor: '#94A3B8', selectedDayBackgroundColor: '#7C3AED',
                                dayTextColor: '#E2E8F0', monthTextColor: '#fff',
                            }}
                        />
                    </View>
                )}

                <View style={styles.listSection}>
                    <View style={styles.sectionHeader}>
                        <CalendarIcon size={16} color="#A855F7" />
                        <Text style={styles.sectionTitle}>
                            {activeTab === 'attendance' ? `${selectedDate} - Ирц` : "Бүх хүсэлтүүд"}
                        </Text>
                    </View>
                    
                    <FlatList
                        data={activeTab === 'attendance' ? attendanceData : leaveRequests}
                        renderItem={activeTab === 'attendance' ? renderAttendanceItem : renderLeaveItem}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl 
                                refreshing={refreshing} 
                                onRefresh={() => activeTab === 'attendance' ? fetchAttendance(selectedDate) : fetchLeaves()} 
                                tintColor="#A855F7" 
                            />
                        }
                        ListEmptyComponent={loading ? <ActivityIndicator size="large" color="#A855F7" style={{marginTop: 40}} /> : (
                            <View style={styles.emptyContainer}><AlertCircle size={48} color="#334155" /><Text style={styles.emptyText}>Мэдээлэл олдсонгүй</Text></View>
                        )}
                    />
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    tabWrapper: { 
        flexDirection: 'row', 
        marginTop: Platform.OS === 'ios' ? 100 : 110, 
        marginHorizontal: 16, 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        borderRadius: 15, 
        padding: 4 
    },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    activeTab: { backgroundColor: '#7C3AED' },
    tabText: { color: '#94A3B8', fontWeight: '600', fontSize: 13 },
    activeTabText: { color: '#fff' },
    calendarContainer: {
        backgroundColor: 'rgba(30, 27, 75, 0.4)',
        margin: 16, borderRadius: 24, padding: 10,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    listSection: { flex: 1, paddingHorizontal: 16, marginTop: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
    listContent: { paddingBottom: 100 },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarGradient: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    userName: { color: '#fff', fontSize: 15, fontWeight: '700' },
    dateLabel: { color: '#64748B', fontSize: 11 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: '800' },
    cardBody: { flexDirection: 'row', gap: 15, marginBottom: 12 },
    timeBox: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
    timeValue: { color: '#E2E8F0', fontSize: 12 },
    cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', paddingTop: 10, alignItems: 'flex-end' },
    totalHoursBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(168, 85, 247, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    totalHoursText: { color: '#A855F7', fontSize: 11, fontWeight: '800' },
    reasonText: { color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginBottom: 12, marginLeft: 52 },
    leaveActionRow: { flexDirection: 'row', gap: 10, marginLeft: 52 },
    miniBtn: { flex: 1, flexDirection: 'row', height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1 },
    rejectBtn: { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    approveBtn: { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    rejectBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
    approveBtnText: { color: '#10B981', fontSize: 12, fontWeight: '700' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#64748B', fontSize: 14 }
});