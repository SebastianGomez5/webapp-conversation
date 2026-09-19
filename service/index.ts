import type { IOnCompleted, IOnData, IOnError, IOnFile, IOnMessageEnd, IOnMessageReplace, IOnNodeFinished, IOnNodeStarted, IOnThought, IOnWorkflowFinished, IOnWorkflowStarted } from './base'
import { del, get, post, ssePost } from './base'
import type { Feedbacktype } from '@/types/app'

export const sendChatMessage = async (
  body: Record<string, any>,
  {
    onData,
    onCompleted,
    onThought,
    onFile,
    onError,
    getAbortController,
    onMessageEnd,
    onMessageReplace,
    onWorkflowStarted,
    onNodeStarted,
    onNodeFinished,
    onWorkflowFinished,
  }: {
    onData: IOnData
    onCompleted: IOnCompleted
    onFile: IOnFile
    onThought: IOnThought
    onMessageEnd: IOnMessageEnd
    onMessageReplace: IOnMessageReplace
    onError: IOnError
    getAbortController?: (abortController: AbortController) => void
    onWorkflowStarted: IOnWorkflowStarted
    onNodeStarted: IOnNodeStarted
    onNodeFinished: IOnNodeFinished
    onWorkflowFinished: IOnWorkflowFinished
  },
) => {
  return ssePost('chat-messages', {
    body: {
      ...body,
      response_mode: 'streaming',
    },
  }, { onData, onCompleted, onThought, onFile, onError, getAbortController, onMessageEnd, onMessageReplace, onNodeStarted, onWorkflowStarted, onWorkflowFinished, onNodeFinished })
}

export const fetchConversations = async () => {
  return get('conversations', { params: { limit: 100, first_id: '' } })
}

export const fetchChatList = async (conversationId: string, botId?: string) => {
  return get('messages', {
    params: {
      conversation_id: conversationId,
      limit: 50,
      last_id: '',
      ...(botId ? { bot_id: botId } : {}),
    },
    headers: botId ? { 'x-bot-id': botId } : undefined,
  })
}

// init value. wait for server update
export const fetchAppParams = async () => {
  return get('parameters')
}

export const updateFeedback = async ({ url, body }: { url: string, body: Feedbacktype }) => {
  return post(url, { body })
}

export const generationConversationName = async (id: string, botId?: string) => {
  return post(`conversations/${id}/name`, {
    body: { auto_generate: true },
    headers: botId ? { 'x-bot-id': botId } : undefined,
  })
}

export const delConversation = async (id: string, botId?: string) => {
  return del(`conversations/${id}`, {
    headers: botId ? { 'x-bot-id': botId } : undefined,
  })
}

export const renameConversation = async (id: string, name: string, botId?: string) => {
  return post(`conversations/${id}/name`, {
    body: { name, auto_generate: false },
    headers: botId ? { 'x-bot-id': botId } : undefined,
  })
}
