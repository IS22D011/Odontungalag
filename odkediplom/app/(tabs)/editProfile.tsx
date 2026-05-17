import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, ScrollView, Dimensions,
} from "react-native";
import { useApp } from "@/contexts/AppContext";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import axios from "axios";
import { ChevronLeft, Camera, User, Phone, Save } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function EditProfileScreen() {
  const { user, updateUser, token } = useApp() as any;
  const router = useRouter();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [image, setImage] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState(user?.avatar || null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Зөвшөөрөл", "Зургийн санд нэвтрэх зөвшөөрөл хэрэгтэй.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setPreviewImage(uri);
      if (Platform.OS === "web") {
        const res = await fetch(uri);
        setImage(await res.blob());
      } else {
        setImage(uri);
      }
    }
  };

  const handleSave = async () => {
    if (!firstName || !lastName) {
      Alert.alert("Анхааруулга", "Овог нэрээ заавал бөглөнө үү.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("phone", phone);
    if (image) {
      if (Platform.OS === "web") {
        formData.append("avatar", image, "profile.jpg");
      } else {
        const filename = image.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        formData.append("avatar", { uri: image, name: filename || "profile.jpg", type: match ? `image/${match[1]}` : "image/jpeg" } as any);
      }
    }
    try {
      const response = await axios({
        method: "patch",
        url: "http://192.168.144.53:8000/api/users/users/me/",
        data: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200 || response.status === 201) {
        if (typeof updateUser === "function") updateUser(response.data);
        Alert.alert("Амжилттай", "Таны мэдээлэл шинэчлэгдлээ.");
        router.back();
      }
    } catch (error: any) {
      const serverError = error.response?.data;
      let msg = "Хадгалахад алдаа гарлаа.";
      if (serverError && typeof serverError === "object") msg = Object.values(serverError).flat().join("\n");
      Alert.alert("Алдаа", msg);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "lastName", label: "Овог", value: lastName, setter: setLastName, placeholder: "Овогоо оруулна уу", icon: User, keyboard: "default" },
    { key: "firstName", label: "Нэр", value: firstName, setter: setFirstName, placeholder: "Нэрээ оруулна уу", icon: User, keyboard: "default" },
    { key: "phone", label: "Утасны дугаар", value: phone, setter: setPhone, placeholder: "99xxxxxx", icon: Phone, keyboard: "phone-pad" },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={["#1E1B4B", "#3730A3"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Профайл засах</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar section inside header */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.avatarWrap}>
            <Image
              source={{ uri: previewImage || "https://via.placeholder.com/150" }}
              style={styles.avatar}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.cameraBtn}>
              <Camera size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Зураг солих</Text>
        </View>
      </LinearGradient>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.formSectionLabel}>Мэдээлэл засах</Text>

        {fields.map((field) => {
          const isFocused = focusedField === field.key;
          return (
            <View key={field.key} style={styles.fieldWrap}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={[styles.inputWrap, isFocused && styles.inputWrapFocused]}>
                <View style={[styles.inputIcon, isFocused && styles.inputIconFocused]}>
                  <field.icon size={16} color={isFocused ? "#6366F1" : "#94A3B8"} />
                </View>
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor="#CBD5E1"
                  keyboardType={field.keyboard as any}
                  onFocus={() => setFocusedField(field.key)}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          );
        })}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.88}
        >
          <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.saveBtnGrad}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Мэдээлэл хадгалах</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Цуцлах</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },

  header: {
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },

  avatarSection: { alignItems: "center" },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.25)",
  },
  cameraBtn: {
    position: "absolute", bottom: 2, right: 2,
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  changePhotoText: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "500", marginTop: 10 },

  form: { paddingHorizontal: 20, paddingTop: 28 },
  formSectionLabel: {
    fontSize: 12, fontWeight: "700", color: "#94A3B8",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 18,
  },

  fieldWrap: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 8, marginLeft: 2 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 16,
    borderWidth: 1.5, borderColor: "#E2E8F0",
    paddingRight: 16,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  inputWrapFocused: { borderColor: "#6366F1", shadowColor: "#6366F1", shadowOpacity: 0.1, shadowRadius: 8 },
  inputIcon: {
    width: 48, height: 52, alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderRightColor: "#F1F5F9",
  },
  inputIconFocused: { borderRightColor: "#EEF2FF" },
  input: { flex: 1, fontSize: 15, color: "#0F172A", paddingVertical: 14, paddingLeft: 14 },

  saveBtn: { marginTop: 10, borderRadius: 18, overflow: "hidden", shadowColor: "#6366F1", shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  saveBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  cancelBtn: { alignItems: "center", paddingVertical: 16, marginTop: 6 },
  cancelText: { color: "#94A3B8", fontSize: 15, fontWeight: "600" },
});