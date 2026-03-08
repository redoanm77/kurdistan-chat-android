import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  bio: string;
  points: number;
  isOnline: boolean;
  createdAt: any;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "users", id)).then(snap => {
      if (snap.exists()) setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: "#fff" }}>المستخدم غير موجود</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        {profile.photoURL ? (
          <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{profile.displayName?.[0] || "?"}</Text>
          </View>
        )}
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: profile.isOnline ? "#22c55e" : "#666" }]} />
          <Text style={[styles.statusText, { color: profile.isOnline ? "#22c55e" : "#666" }]}>
            {profile.isOnline ? "متصل الآن" : "غير متصل"}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.name}>{profile.displayName}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.points || 0}</Text>
            <Text style={styles.statLabel}>نقطة</Text>
          </View>
        </View>
      </View>

      {/* Send Message */}
      <TouchableOpacity
        style={styles.msgBtn}
        onPress={() => router.push(`/chat/${id}`)}
      >
        <Ionicons name="chatbubble" size={20} color="#fff" />
        <Text style={styles.msgBtnText}>إرسال رسالة خاصة</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  loading: { flex: 1, backgroundColor: "#0f0f1a", justifyContent: "center", alignItems: "center" },
  avatarSection: { alignItems: "center", paddingVertical: 32, paddingTop: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: "#7c3aed" },
  avatarPlaceholder: { backgroundColor: "#7c3aed", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "bold" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14 },
  infoCard: {
    margin: 16, backgroundColor: "#1a1a2e", borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: "#2a2a3e", alignItems: "center",
  },
  name: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  bio: { color: "#ccc", fontSize: 15, marginTop: 10, textAlign: "center" },
  statsRow: { flexDirection: "row", marginTop: 16 },
  stat: { alignItems: "center", paddingHorizontal: 20 },
  statValue: { color: "#7c3aed", fontSize: 24, fontWeight: "bold" },
  statLabel: { color: "#888", fontSize: 13 },
  msgBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#7c3aed", borderRadius: 12, padding: 16,
    margin: 16, justifyContent: "center",
  },
  msgBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
