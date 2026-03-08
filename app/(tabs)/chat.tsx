import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import {
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  id: string;
  text: string;
  uid: string;
  displayName: string;
  photoURL: string;
  createdAt: any;
}

export default function ChatScreen() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const q = query(
      collection(db, "publicChat"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)).reverse();
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsub;
  }, []);

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    const msg = text.trim();
    setText("");
    try {
      await addDoc(collection(db, "publicChat"), {
        text: msg,
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || "مجهول",
        photoURL: profile?.photoURL || user.photoURL || "",
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.uid === user?.uid;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.msgAvatar} />
          ) : (
            <View style={[styles.msgAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{item.displayName?.[0] || "?"}</Text>
            </View>
          )
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!isMe && <Text style={styles.msgName}>{item.displayName}</Text>}
          <Text style={styles.msgText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الدردشة العامة</Text>
        <Ionicons name="chatbubbles" size={22} color="#7c3aed" />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="اكتب رسالة..."
          placeholderTextColor="#666"
          value={text}
          onChangeText={setText}
          multiline
          textAlign="right"
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: "#1a1a2e",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  messagesList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  msgRowMe: { flexDirection: "row-reverse" },
  msgAvatar: { width: 32, height: 32, borderRadius: 16, marginHorizontal: 8 },
  avatarPlaceholder: { backgroundColor: "#7c3aed", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  bubble: {
    maxWidth: "75%", padding: 10, borderRadius: 16,
  },
  bubbleMe: { backgroundColor: "#7c3aed", borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: "#1a1a2e", borderBottomLeftRadius: 4 },
  msgName: { color: "#7c3aed", fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  msgText: { color: "#fff", fontSize: 15 },
  inputRow: {
    flexDirection: "row", padding: 12, borderTopWidth: 1,
    borderTopColor: "#1a1a2e", alignItems: "flex-end", gap: 8,
  },
  input: {
    flex: 1, backgroundColor: "#1a1a2e", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, color: "#fff",
    fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: "#2a2a3e",
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#7c3aed", justifyContent: "center", alignItems: "center",
  },
});
