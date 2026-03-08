import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, TextInput,
} from "react-native";
import { signOut, updateProfile, deleteUser } from "firebase/auth";
import { doc, updateDoc, deleteDoc, collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user, profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: name });
      await updateDoc(doc(db, "users", user.uid), { displayName: name, bio });
      setEditing(false);
      Alert.alert("تم", "تم تحديث الملف الشخصي");
    } catch (e) {
      Alert.alert("خطأ", "حدث خطأ أثناء التحديث");
    }
  };

  const handleLogout = async () => {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          try {
            if (user) {
              await updateDoc(doc(db, "users", user.uid), { isOnline: false });
            }
            await signOut(auth);
            router.replace("/(auth)/login");
          } catch (e) {
            Alert.alert("خطأ", "حدث خطأ أثناء تسجيل الخروج");
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "حذف الحساب",
      "هل أنت متأكد؟ سيتم حذف حسابك وجميع بياناتك نهائياً.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف نهائياً",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              // حذف البيانات
              const batch = writeBatch(db);
              batch.delete(doc(db, "users", user.uid));
              // حذف الإشعارات
              const notifQ = query(collection(db, "notifications"), where("toUid", "==", user.uid));
              const notifSnap = await getDocs(notifQ);
              notifSnap.docs.forEach(d => batch.delete(d.ref));
              await batch.commit();
              // حذف الحساب
              await deleteUser(user);
              router.replace("/(auth)/login");
            } catch (e) {
              Alert.alert("خطأ", "حدث خطأ أثناء حذف الحساب. قد تحتاج إلى إعادة تسجيل الدخول أولاً.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>حسابي</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Ionicons name={editing ? "close" : "create-outline"} size={24} color="#7c3aed" />
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        {profile?.photoURL ? (
          <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{profile?.displayName?.[0] || "?"}</Text>
          </View>
        )}
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>متصل</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        {editing ? (
          <>
            <Text style={styles.label}>الاسم</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              textAlign="right"
              placeholderTextColor="#666"
            />
            <Text style={styles.label}>النبذة التعريفية</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              multiline
              textAlign="right"
              placeholderTextColor="#666"
              placeholder="اكتب نبذة عنك..."
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.name}>{profile?.displayName || user?.displayName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {profile?.bio ? (
              <Text style={styles.bio}>{profile.bio}</Text>
            ) : null}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{profile?.points || 0}</Text>
                <Text style={styles.statLabel}>نقطة</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>منطقة الخطر</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={styles.deleteText}>حذف الحساب نهائياً</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, paddingTop: 50,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: "#7c3aed" },
  avatarPlaceholder: { backgroundColor: "#7c3aed", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "bold" },
  onlineBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e" },
  onlineText: { color: "#22c55e", fontSize: 14 },
  infoCard: {
    margin: 16, backgroundColor: "#1a1a2e", borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: "#2a2a3e",
  },
  name: { fontSize: 24, fontWeight: "bold", color: "#fff", textAlign: "center" },
  email: { color: "#888", fontSize: 14, textAlign: "center", marginTop: 4 },
  bio: { color: "#ccc", fontSize: 15, textAlign: "center", marginTop: 12 },
  statsRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  stat: { alignItems: "center", paddingHorizontal: 20 },
  statValue: { color: "#7c3aed", fontSize: 24, fontWeight: "bold" },
  statLabel: { color: "#888", fontSize: 13 },
  label: { color: "#888", fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#0f0f1a", borderRadius: 10, padding: 12,
    color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "#2a2a3e",
  },
  bioInput: { height: 80, textAlignVertical: "top" },
  saveBtn: {
    backgroundColor: "#7c3aed", borderRadius: 10, padding: 14,
    alignItems: "center", marginTop: 16,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  actions: { margin: 16 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1a1a2e", borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: "#ef4444",
  },
  logoutText: { color: "#ef4444", fontSize: 16 },
  dangerZone: { margin: 16, marginTop: 0 },
  dangerTitle: { color: "#ef4444", fontSize: 14, marginBottom: 8, fontWeight: "bold" },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1a0a0a", borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: "#ef4444",
  },
  deleteText: { color: "#ef4444", fontSize: 16 },
});
