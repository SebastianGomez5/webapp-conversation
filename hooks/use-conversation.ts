import { useState } from 'react'
import produce from 'immer'
import { useGetState } from 'ahooks'
import type { ConversationItem } from '@/types/app'

const storageConversationIdKey = 'conversationIdInfo'

type ConversationInfoType = Omit<ConversationItem, 'inputs' | 'id'>
function useConversation() {
  const [conversationList, setConversationList] = useState<ConversationItem[]>([])
  const [currConversationId, doSetCurrConversationId, getCurrConversationId] = useGetState<string>('-1')

  const setCurrConversationId = (id: string, appId: string, isSetToLocalStroge = true, _newConversationName = '') => {
    doSetCurrConversationId(id)
    if (isSetToLocalStroge && id !== '-1') {
      try {
        const raw = globalThis.localStorage?.getItem(storageConversationIdKey)
        const conversationIdInfo = raw ? JSON.parse(raw) : {}
        conversationIdInfo[appId] = id
        globalThis.localStorage?.setItem(storageConversationIdKey, JSON.stringify(conversationIdInfo))
      }
      catch (e) {
        // ignore localStorage error
      }
    }
  }

  const getConversationIdFromStorage = (appId: string) => {
    try {
      const raw = globalThis.localStorage?.getItem(storageConversationIdKey)
      const conversationIdInfo = raw ? JSON.parse(raw) : {}
      const id = conversationIdInfo[appId]
      return id || null
    }
    catch (e) {
      return null
    }
  }

  const isNewConversation = currConversationId === '-1'
  const [newConversationInputs, setNewConversationInputs] = useState<Record<string, any> | null>(null)
  const resetNewConversationInputs = () => {
    if (!newConversationInputs) { return }
    setNewConversationInputs(produce(newConversationInputs, (draft) => {
      Object.keys(draft).forEach((key) => {
        draft[key] = ''
      })
    }))
  }
  const [existConversationInputs, setExistConversationInputs] = useState<Record<string, any> | null>(null)
  const currInputs = isNewConversation ? newConversationInputs : existConversationInputs
  const setCurrInputs = isNewConversation ? setNewConversationInputs : setExistConversationInputs

  const [newConversationInfo, setNewConversationInfo] = useState<ConversationInfoType | null>(null)
  const [existConversationInfo, setExistConversationInfo] = useState<ConversationInfoType | null>(null)
  const currConversationInfo = isNewConversation ? newConversationInfo : existConversationInfo

  return {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    getConversationIdFromStorage,
    isNewConversation,
    currInputs,
    newConversationInputs,
    existConversationInputs,
    resetNewConversationInputs,
    setCurrInputs,
    currConversationInfo,
    setNewConversationInfo,
    setExistConversationInfo,
  }
}

export default useConversation
