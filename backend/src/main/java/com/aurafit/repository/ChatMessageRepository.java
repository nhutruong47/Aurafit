package com.aurafit.repository;

import com.aurafit.entity.ChatMessage;
import com.aurafit.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByChatSessionOrderByCreatedAtAsc(ChatSession chatSession);
}
