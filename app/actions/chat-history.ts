"use server";

import { createClient } from "@/lib/supabase/server";

export type PersistedChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type PersistedConversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: PersistedChatMessage[];
};

const MAX_FALLBACK_CONVERSATIONS = 20;

function generateConversationTitle(firstMessage: string): string {
  const cleaned = firstMessage.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Environmental Inquiry";
  return cleaned.length > 48 ? `${cleaned.slice(0, 48).trim()}…` : cleaned;
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("chat_conversations") ||
    msg.includes("chat_messages")
  );
}

function readMetadataConversations(
  userId: string,
  metadata: Record<string, unknown> | undefined
): PersistedConversation[] {
  if (!metadata || !Array.isArray(metadata.ecoguard_chat_conversations)) {
    return [];
  }

  return (metadata.ecoguard_chat_conversations as PersistedConversation[])
    .filter(
      (conv) =>
        conv &&
        typeof conv.id === "string" &&
        (!conv.user_id || conv.user_id === userId) &&
        Array.isArray(conv.messages)
    )
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
}

/**
 * Loads all saved conversations and their messages for the currently authenticated user.
 * Uses the `chat_conversations` and `chat_messages` tables when present, and falls back
 * seamlessly to the authenticated user's Supabase user_metadata if the migration table
 * has not yet been applied on the remote Supabase instance.
 */
export async function getChatHistory(): Promise<{
  success: boolean;
  userId?: string;
  conversations: PersistedConversation[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      conversations: [],
      error: "Not authenticated.",
    };
  }

  // 1. Try querying relational tables first
  const { data: convRows, error: convError } = await supabase
    .from("chat_conversations")
    .select("id, user_id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (!convError && convRows) {
    if (convRows.length === 0) {
      // Also check if there were conversations stored in metadata fallback
      const metaConversations = readMetadataConversations(
        user.id,
        user.user_metadata
      );
      return {
        success: true,
        userId: user.id,
        conversations: metaConversations,
      };
    }

    const conversationIds = convRows.map((c) => c.id);
    const { data: msgRows, error: msgError } = await supabase
      .from("chat_messages")
      .select("id, conversation_id, role, content, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: true });

    if (!msgError && msgRows) {
      const messagesByConv = new Map<string, PersistedChatMessage[]>();
      for (const m of msgRows) {
        const list = messagesByConv.get(m.conversation_id) ?? [];
        list.push({
          id: m.id,
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
          created_at: m.created_at,
        });
        messagesByConv.set(m.conversation_id, list);
      }

      const conversations: PersistedConversation[] = convRows.map((c) => ({
        id: c.id,
        user_id: c.user_id,
        title: c.title,
        created_at: c.created_at,
        updated_at: c.updated_at,
        messages: messagesByConv.get(c.id) ?? [],
      }));

      return {
        success: true,
        userId: user.id,
        conversations,
      };
    }
  }

  // 2. Fallback to authenticated Supabase user_metadata storage if table is not created yet
  if (isMissingTableError(convError)) {
    const conversations = readMetadataConversations(user.id, user.user_metadata);
    return {
      success: true,
      userId: user.id,
      conversations,
    };
  }

  return {
    success: true,
    userId: user.id,
    conversations: readMetadataConversations(user.id, user.user_metadata),
  };
}

/**
 * Saves a user message and assistant response to an existing or newly created conversation.
 */
export async function saveChatMessagePair(input: {
  conversationId?: string | null;
  userMessage: string;
  assistantMessage: string;
}): Promise<{
  success: boolean;
  conversation?: PersistedConversation;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "You must be signed in to save chat history.",
    };
  }

  const nowIso = new Date().toISOString();
  const assistantTimeIso = new Date(Date.now() + 10).toISOString();
  const title = generateConversationTitle(input.userMessage);
  let targetConvId = input.conversationId || null;

  // 1. Try saving in relational tables first
  let useMetadataFallback = false;

  if (!targetConvId) {
    const { data: createdConv, error: createError } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: user.id,
        title,
        created_at: nowIso,
        updated_at: assistantTimeIso,
      })
      .select("id, user_id, title, created_at, updated_at")
      .single();

    if (createError) {
      if (isMissingTableError(createError)) {
        useMetadataFallback = true;
      } else {
        useMetadataFallback = true;
      }
    } else if (createdConv) {
      targetConvId = createdConv.id;
    }
  } else {
    const { error: updateError } = await supabase
      .from("chat_conversations")
      .update({ updated_at: assistantTimeIso })
      .eq("id", targetConvId)
      .eq("user_id", user.id);

    if (updateError && isMissingTableError(updateError)) {
      useMetadataFallback = true;
    }
  }

  if (!useMetadataFallback && targetConvId) {
    const { error: insertMsgError } = await supabase
      .from("chat_messages")
      .insert([
        {
          conversation_id: targetConvId,
          user_id: user.id,
          role: "user",
          content: input.userMessage,
          created_at: nowIso,
        },
        {
          conversation_id: targetConvId,
          user_id: user.id,
          role: "assistant",
          content: input.assistantMessage,
          created_at: assistantTimeIso,
        },
      ]);

    if (!insertMsgError) {
      const { data: allMessages } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", targetConvId)
        .order("created_at", { ascending: true });

      const { data: convData } = await supabase
        .from("chat_conversations")
        .select("id, user_id, title, created_at, updated_at")
        .eq("id", targetConvId)
        .single();

      if (convData) {
        return {
          success: true,
          conversation: {
            id: convData.id,
            user_id: convData.user_id,
            title: convData.title,
            created_at: convData.created_at,
            updated_at: convData.updated_at,
            messages: (allMessages ?? []).map((m) => ({
              id: m.id,
              role: m.role === "user" ? "user" : "assistant",
              content: m.content,
              created_at: m.created_at,
            })),
          },
        };
      }
    } else {
      useMetadataFallback = true;
    }
  }

  // 2. Fallback: persist in Supabase Auth user_metadata for the authenticated user
  const existing = readMetadataConversations(user.id, user.user_metadata);
  const newUserMsg: PersistedChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: input.userMessage,
    created_at: nowIso,
  };
  const newAssistantMsg: PersistedChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: input.assistantMessage,
    created_at: assistantTimeIso,
  };

  let updatedConv: PersistedConversation | undefined;
  let nextConversations: PersistedConversation[];

  if (targetConvId) {
    const found = existing.find((c) => c.id === targetConvId);
    if (found) {
      updatedConv = {
        ...found,
        updated_at: assistantTimeIso,
        messages: [...found.messages, newUserMsg, newAssistantMsg],
      };
      nextConversations = [
        updatedConv,
        ...existing.filter((c) => c.id !== targetConvId),
      ].slice(0, MAX_FALLBACK_CONVERSATIONS);
    } else {
      updatedConv = {
        id: targetConvId,
        user_id: user.id,
        title,
        created_at: nowIso,
        updated_at: assistantTimeIso,
        messages: [newUserMsg, newAssistantMsg],
      };
      nextConversations = [updatedConv, ...existing].slice(
        0,
        MAX_FALLBACK_CONVERSATIONS
      );
    }
  } else {
    updatedConv = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title,
      created_at: nowIso,
      updated_at: assistantTimeIso,
      messages: [newUserMsg, newAssistantMsg],
    };
    nextConversations = [updatedConv, ...existing].slice(
      0,
      MAX_FALLBACK_CONVERSATIONS
    );
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      ecoguard_chat_conversations: nextConversations,
    },
  });

  if (metaError) {
    return {
      success: false,
      error: metaError.message,
    };
  }

  return {
    success: true,
    conversation: updatedConv,
  };
}

/**
 * Deletes a conversation and its messages for the authenticated user.
 */
export async function deleteChatConversation(conversationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!conversationId) {
    return { success: false, error: "Invalid conversation ID." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "You must be signed in to delete conversations.",
    };
  }

  // 1. Delete from relational table if it exists
  await supabase
    .from("chat_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", user.id);

  // 2. Also remove from user_metadata if stored there
  const existing = readMetadataConversations(user.id, user.user_metadata);
  if (existing.some((c) => c.id === conversationId)) {
    const filtered = existing.filter((c) => c.id !== conversationId);
    await supabase.auth.updateUser({
      data: {
        ecoguard_chat_conversations: filtered,
      },
    });
  }

  return { success: true };
}