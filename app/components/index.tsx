'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import produce, { setAutoFreeze } from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import {
  Sun,
  Moon,
  Headphones,
  Radio,
  Globe,
  X,
  Menu,
} from 'lucide-react'
import useConversation from '@/hooks/use-conversation'
import Toast from '@/app/components/base/toast'
import Sidebar from '@/app/components/sidebar'
import { delConversation, fetchAppParams, fetchChatList, fetchConversations, generationConversationName, sendChatMessage, updateFeedback } from '@/service'
import type { ChatItem, ConversationItem, Feedbacktype, PromptConfig, VisionFile, VisionSettings } from '@/types/app'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { Resolution, TransferMethod, WorkflowRunningStatus } from '@/types/app'
import Chat from '@/app/components/chat'
import Loading from '@/app/components/base/loading'
import AppUnavailable from '@/app/components/app-unavailable'
import { API_KEY, APP_ID, APP_INFO, isShowPrompt, promptTemplate } from '@/config'
import type { Annotation as AnnotationType } from '@/types/log'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'
import { replaceVarWithValues, userInputsFormToPromptVariables } from '@/utils/prompt'
import { CustomizationModal, DEFAULT_CUSTOMIZATION } from '@/app/components/settings/customization-modal'
import type { UserCustomization } from '@/app/components/settings/customization-modal'
import { AGENTS_LIST, getAgentById } from '@/config/agents'
import type { AgentConfig } from '@/config/agents'
import LoginView from '@/app/components/auth/login-view'
import type { AuthenticatedUser } from '@/config/roles'
import { getRoleDisplayName } from '@/config/roles'

export interface IMainProps {
  params: any
}

const Main: FC<IMainProps> = () => {
  const { t } = useTranslation()
  const { notify } = Toast
  const hasSetAppConfig = APP_ID && API_KEY

  // --- Estados de Tema y UI Futurista ---
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // --- Personalización del Usuario & Aspecto Visual ---
  const [customization, setCustomization] = useState<UserCustomization>(DEFAULT_CUSTOMIZATION)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('amyet_user_customization')
        if (saved) {
          setCustomization({ ...DEFAULT_CUSTOMIZATION, ...JSON.parse(saved) })
        }
      }
      catch (e) {
        // ignore
      }
    }
  }, [])

  const handleSaveCustomization = (newCustomization: UserCustomization) => {
    setCustomization(newCustomization)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amyet_user_customization', JSON.stringify(newCustomization))
        notify({ type: 'success', message: '¡Ajustes y personalización guardados!' })
      }
      catch (e) {
        // ignore
      }
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarOpen(true)
    }
  }, [])

  // --- Modales y Overlays ---
  const [showSettings, setShowSettings] = useState(false)
  const [showVoiceOrb, setShowVoiceOrb] = useState(false)
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  // --- Autenticación & Usuario Activo de WordPress ---
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null)
  const [authChecking, setAuthChecking] = useState(true)

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (res.ok && data.authenticated && data.user) {
        setCurrentUser(data.user)
      }
    }
    catch (e) {
      console.error('Error checking auth:', e)
    }
    finally {
      setAuthChecking(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    }
    catch {
      // ignore
    }
    setCurrentUser(null)
    setChatList([])
    setConversationList([])
    notify({ type: 'info', message: 'Has cerrado sesión en Studio.' })
  }

  // --- Agentes Disponibles según el Rol de Usuario (RBAC) ---
  const allowedBots = currentUser?.allowed_bots || ['carlos']
  const visibleAgents = AGENTS_LIST.filter(a => allowedBots.includes(a.id))

  // --- Lista de Mensajes del Chat Unificado ---
  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])

  // --- Agentes Dify (Multi-Agent Switcher) ---
  const [activeAgent, setActiveAgent] = useState<AgentConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedBotId = localStorage.getItem('amyet_active_bot_id')
        return getAgentById(savedBotId || 'carlos')
      }
      catch (e) {
        return AGENTS_LIST[0]
      }
    }
    return AGENTS_LIST[0]
  })

  // Sincronizar datos del usuario autenticado con la personalización y selección de bot
  useEffect(() => {
    if (currentUser) {
      setCustomization(prev => ({
        ...prev,
        userName: currentUser.name || prev.userName,
        userRole: getRoleDisplayName(currentUser.role) || prev.userRole,
        userAvatar: currentUser.avatar || prev.userAvatar,
      }))

      let initialBot = activeAgent
      if (currentUser.allowed_bots && currentUser.allowed_bots.length > 0) {
        const savedBotId = typeof window !== 'undefined' ? localStorage.getItem('amyet_active_bot_id') : null
        if (!savedBotId || !currentUser.allowed_bots.includes(savedBotId)) {
          initialBot = getAgentById(currentUser.allowed_bots[0])
          setActiveAgent(initialBot)
          if (typeof window !== 'undefined') {
            localStorage.setItem('amyet_active_bot_id', initialBot.id)
          }
        }
      }

      // Cargar lista de conversaciones limpias para este usuario
      (async () => {
        try {
          const resConvs: any = await fetchConversations().catch(() => ({ data: [] }))
          const conversations: ConversationItem[] = Array.isArray(resConvs?.data)
            ? resConvs.data
            : Array.isArray(resConvs)
              ? resConvs
              : []
          setConversationList(conversations)
          if (conversations.length > 0) {
            const firstConv = conversations[0]
            if (firstConv.botId) {
              const b = getAgentById(firstConv.botId)
              if (b) {
                setActiveAgent(b)
                if (typeof window !== 'undefined') {
                  localStorage.setItem('amyet_active_bot_id', b.id)
                }
              }
            }
            setCurrConversationId(conversations[0].id, APP_ID)
          }
          else {
            setChatList(generateNewChatListWithOpenStatement(undefined, undefined, initialBot))
          }
        }
        catch {
          setChatList(generateNewChatListWithOpenStatement(undefined, undefined, initialBot))
        }
      })()
    }
  }, [currentUser])

  useEffect(() => {
    if (visibleAgents.length > 0 && !visibleAgents.some(a => a.id === activeAgent?.id)) {
      const firstAllowed = visibleAgents[0]
      setActiveAgent(firstAllowed)
      if (typeof window !== 'undefined') {
        localStorage.setItem('amyet_active_bot_id', firstAllowed.id)
      }
    }
  }, [currentUser, visibleAgents, activeAgent])

  const [botConversationMap, setBotConversationMap] = useState<Record<string, string>>({})

  const handleSelectAgent = (agent: AgentConfig) => {
    if (agent.id === activeAgent.id) { return }
    setActiveAgent(agent)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amyet_active_bot_id', agent.id)
      }
      catch {
        // ignore
      }
    }

    // Cada chat pertenece exclusivamente a un agente: abrir un chat limpio para el nuevo agente sin borrar los anteriores
    createNewChat(agent)

    notify({
      type: 'success',
      message: `Chat con ${agent.name} (${agent.role})`,
    })
  }

  // --- Estados de Voz y Entrada ---
  const [inputText, setInputText] = useState('')
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [isSpeakingMessageId, setIsSpeakingMessageId] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  // --- Inicialización de SpeechRecognition para Voz a Texto (STT) ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'es-ES'

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('')
          setInputText(transcript)
        }

        recognition.onerror = () => setIsRecordingAudio(false)
        recognition.onend = () => setIsRecordingAudio(false)

        recognitionRef.current = recognition
      }
    }
  }, [])

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      notify({ type: 'info', message: 'Tu navegador no soporta reconocimiento de voz nativo.' })
      return
    }

    if (isRecordingAudio) {
      recognitionRef.current.stop()
      setIsRecordingAudio(false)
    }
    else {
      setInputText('')
      recognitionRef.current.start()
      setIsRecordingAudio(true)
    }
  }

  // --- Texto a Voz (TTS) ---
  const speakText = (text: string, messageId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) { return }

    if (isSpeakingMessageId === messageId) {
      window.speechSynthesis.cancel()
      setIsSpeakingMessageId(null)
      return
    }

    window.speechSynthesis.cancel()
    const cleanText = text.replace(/[#*`_]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'es-ES'
    utterance.rate = customization.speechRate || 1

    utterance.onend = () => setIsSpeakingMessageId(null)
    utterance.onerror = () => setIsSpeakingMessageId(null)

    setIsSpeakingMessageId(messageId)
    window.speechSynthesis.speak(utterance)
  }

  // --- App Info y Dify Config ---
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [inited, setInited] = useState<boolean>(false)
  const [visionConfig, setVisionConfig] = useState<VisionSettings | undefined>({
    enabled: false,
    number_limits: 2,
    detail: Resolution.low,
    transfer_methods: [TransferMethod.local_file],
  })
  const [fileConfig, setFileConfig] = useState<FileUpload | undefined>()

  useEffect(() => {
    if (APP_INFO?.title) { document.title = `${APP_INFO.title} - Desarrollado por Studio Álvaro Díaz` }
  }, [APP_INFO?.title])

  useEffect(() => {
    setAutoFreeze(false)
    return () => {
      setAutoFreeze(true)
    }
  }, [])

  // --- Conversaciones Dify ---
  const {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    isNewConversation,
    currConversationInfo,
    currInputs,
    newConversationInputs,
    resetNewConversationInputs,
    setCurrInputs,
    setExistConversationInfo,
  } = useConversation()

  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  const [isChatStarted, { setTrue: setChatStarted, setFalse: setChatNotStarted }] = useBoolean(false)

  const rawName = currConversationInfo?.name || t('app.chat.newChatDefaultName', { defaultValue: 'Nueva Conversación' }) as string
  const conversationName = rawName === 'app.chat.newChatDefaultName' ? 'Nueva Conversación' : rawName
  const conversationIntroduction = currConversationInfo?.introduction || ''
  const suggestedQuestions = currConversationInfo?.suggested_questions || []

  const generateNewChatListWithOpenStatement = (introduction?: string, inputs?: Record<string, any> | null, agentToUse?: AgentConfig) => {
    const targetAgent = agentToUse || activeAgent
    const isCarlos = targetAgent?.id === 'carlos'

    let calculatedIntroduction = isCarlos
      ? (introduction || conversationIntroduction || targetAgent?.welcomeMessage || '')
      : (targetAgent?.welcomeMessage || '')

    const calculatedPromptVariables = inputs || currInputs || null
    if (calculatedIntroduction && calculatedPromptVariables) {
      calculatedIntroduction = replaceVarWithValues(calculatedIntroduction, promptConfig?.prompt_variables || [], calculatedPromptVariables)
    }

    const questions = (isCarlos && suggestedQuestions && suggestedQuestions.length > 0)
      ? suggestedQuestions
      : targetAgent?.suggestedQuestions || []

    const openStatement = {
      id: `${Date.now()}`,
      content: calculatedIntroduction || targetAgent?.welcomeMessage || '',
      isAnswer: true,
      feedbackDisabled: true,
      isOpeningStatement: isShowPrompt,
      suggestedQuestions: questions,
      botId: targetAgent?.id,
      botName: targetAgent?.name,
      botAvatar: targetAgent?.avatar,
      botRole: targetAgent?.role,
    }
    return [openStatement]
  }

  const handleConversationSwitch = () => {
    if (!inited) { return }

    let notSyncToStateIntroduction = ''
    let notSyncToStateInputs: Record<string, any> | undefined | null = {}
    if (!isNewConversation) {
      const item = conversationList.find(c => c.id === currConversationId)
      notSyncToStateInputs = item?.inputs || {}
      setCurrInputs(notSyncToStateInputs as any)
      notSyncToStateIntroduction = item?.introduction || ''
      setExistConversationInfo({
        name: item?.name || '',
        introduction: notSyncToStateIntroduction,
        suggested_questions: suggestedQuestions,
      })

      const botForConv = item?.botId ? (AGENTS_LIST.find(a => a.id === item.botId) || activeAgent) : activeAgent
      if (botForConv && botForConv.id !== activeAgent.id) {
        setActiveAgent(botForConv)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('amyet_active_bot_id', botForConv.id)
          }
          catch {
            // ignore
          }
        }
      }

      if (!conversationIdChangeBecauseOfNew && !isResponding) {
        fetchChatList(currConversationId, botForConv?.id).then((res: any) => {
          const { data } = res
          const newChatList: ChatItem[] = generateNewChatListWithOpenStatement(notSyncToStateIntroduction, notSyncToStateInputs, botForConv)

          data.forEach((item: any) => {
            newChatList.push({
              id: `question-${item.id}`,
              content: item.query,
              isAnswer: false,
              message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],
            })
            newChatList.push({
              id: item.id,
              content: item.answer,
              agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
              feedback: item.feedback,
              isAnswer: true,
              message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
              botId: botForConv?.id,
              botName: botForConv?.name,
              botAvatar: botForConv?.avatar,
              botRole: botForConv?.role,
            })
          })
          setChatList(newChatList)
        })
      }
    }
    else {
      notSyncToStateInputs = newConversationInputs
      setCurrInputs(notSyncToStateInputs)
      if (isChatStarted) {
        setChatList(generateNewChatListWithOpenStatement(undefined, undefined, activeAgent))
      }
    }
  }

  useEffect(handleConversationSwitch, [currConversationId, inited])

  const createNewChat = (agent = activeAgent) => {
    const cleanList = conversationList.filter(item => item.id !== '-1')
    setConversationList([
      {
        id: '-1',
        name: 'Nueva conversación',
        inputs: newConversationInputs,
        introduction: agent.welcomeMessage,
        suggested_questions: agent.suggestedQuestions,
        botId: agent.id,
      },
      ...cleanList,
    ])
    setCurrConversationId('-1', APP_ID)
    setConversationIdChangeBecauseOfNew(true)
    setChatList(generateNewChatListWithOpenStatement(undefined, undefined, agent))
  }

  const handleConversationIdChange = (id: string, botId?: string) => {
    setBotConversationMap({})
    if (id === '-1') {
      createNewChat(activeAgent)
      setConversationIdChangeBecauseOfNew(true)
    }
    else {
      const targetConv = conversationList.find(c => c.id === id)
      const targetBotId = botId || targetConv?.botId || activeAgent?.id || 'carlos'
      const targetAgent = AGENTS_LIST.find(a => a.id === targetBotId) || AGENTS_LIST[0]
      if (targetAgent && targetAgent.id !== activeAgent.id) {
        setActiveAgent(targetAgent)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('amyet_active_bot_id', targetAgent.id)
          }
          catch {
            // ignore
          }
        }
      }
      setConversationIdChangeBecauseOfNew(false)
    }
    setCurrConversationId(id, APP_ID)
  }

  const handleDeleteChat = async (id: string, botId?: string) => {
    const targetConv = conversationList.find(c => c.id === id)
    const targetBot = botId || targetConv?.botId || activeAgent?.id
    try {
      await delConversation(id, targetBot)
      const updatedList = conversationList.filter(c => c.id !== id)
      setConversationList(updatedList)
      if (currConversationId === id) {
        if (updatedList.length > 0) {
          handleConversationIdChange(updatedList[0].id, updatedList[0].botId)
        }
        else {
          createNewChat()
        }
      }
      notify({ type: 'success', message: 'Conversación eliminada' })
    }
    catch {
      notify({ type: 'error', message: 'No se pudo eliminar la conversación' })
    }
  }

  // --- Carga Inicial de Parámetros ---
  useEffect(() => {
    (async () => {
      try {
        const [appParams, resConvs]: any = await Promise.all([
          fetchAppParams().catch(() => ({})),
          fetchConversations().catch(() => ({ data: [] })),
        ])

        const conversations: ConversationItem[] = Array.isArray(resConvs?.data)
          ? resConvs.data
          : Array.isArray(resConvs)
            ? resConvs
            : []

        const { user_input_form, file_upload, system_parameters }: any = appParams || {}
        let _conversationId: string | null = null
        try {
          _conversationId = getConversationIdFromStorage(APP_ID)
        }
        catch (e) {
          // ignore
        }
        const isNotNewConversation = _conversationId ? conversations.some((c: any) => c.id === _conversationId) : false

        const prompt_variables = userInputsFormToPromptVariables(user_input_form || [])
        setPromptConfig({
          prompt_template: promptTemplate,
          prompt_variables,
        } as PromptConfig)

        const outerFileUploadEnabled = !!file_upload?.enabled
        setVisionConfig({
          ...file_upload?.image,
          enabled: !!(outerFileUploadEnabled && file_upload?.image?.enabled),
          image_file_size_limit: system_parameters?.system_parameters || 0,
          transfer_methods: file_upload?.image?.transfer_methods || [TransferMethod.local_file],
        })
        setFileConfig({
          enabled: outerFileUploadEnabled,
          allowed_file_types: file_upload?.allowed_file_types,
          allowed_file_extensions: file_upload?.allowed_file_extensions,
          allowed_file_upload_methods: file_upload?.allowed_file_upload_methods,
          number_limits: file_upload?.number_limits,
          fileUploadConfig: file_upload?.fileUploadConfig,
        })
        setConversationList(conversations)

        if (isNotNewConversation && _conversationId) {
          setCurrConversationId(_conversationId, APP_ID, false)
        }
        else {
          setChatList(generateNewChatListWithOpenStatement())
        }

        setInited(true)
      }
      catch (e: any) {
        setPromptConfig({
          prompt_template: promptTemplate,
          prompt_variables: [],
        } as PromptConfig)
        setChatList(generateNewChatListWithOpenStatement())
        setInited(true)
      }
    })()
  }, [])

  // --- Envío de Mensajes y Streaming SSE ---
  const [isResponding, { setTrue: setRespondingTrue, setFalse: setRespondingFalse }] = useBoolean(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const handleStop = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setRespondingFalse()
  }

  const updateCurrentQA = ({
    responseItem,
    questionId,
    placeholderAnswerId,
    questionItem,
  }: {
    responseItem: ChatItem
    questionId: string
    placeholderAnswerId: string
    questionItem: ChatItem
  }) => {
    const newListWithAnswer = produce(
      getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
      (draft) => {
        if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }
        draft.push({ ...responseItem })
      },
    )
    setChatList(newListWithAnswer)
  }

  const handleSend = async (message: string, files?: VisionFile[]) => {
    if (isResponding) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return
    }

    const targetBotId = activeAgent?.id || 'carlos'
    const isNew = isNewConversation || currConversationId === '-1'

    const data: Record<string, any> = {
      inputs: currInputs || {},
      query: message,
      conversation_id: isNew ? null : currConversationId,
    }

    if (files && files.length > 0) {
      data.files = files.map((item) => {
        if (item.transfer_method === TransferMethod.local_file) {
          return {
            type: item.type || 'document',
            transfer_method: TransferMethod.local_file,
            upload_file_id: item.upload_file_id,
          }
        }
        return item
      })
    }

    const questionId = `question-${Date.now()}`
    const questionItem = {
      id: questionId,
      content: message,
      isAnswer: false,
      message_files: files || [],
    }

    const placeholderAnswerId = `answer-placeholder-${Date.now()}`
    const placeholderAnswerItem = {
      id: placeholderAnswerId,
      content: '',
      isAnswer: true,
      botId: activeAgent?.id,
      botName: activeAgent?.name,
      botAvatar: activeAgent?.avatar,
      botRole: activeAgent?.role,
    }

    const newList = [...getChatList(), questionItem, placeholderAnswerItem]
    setChatList(newList)

    let isAgentMode = false

    const responseItem: ChatItem = {
      id: `${Date.now()}`,
      content: '',
      agent_thoughts: [],
      message_files: [],
      isAnswer: true,
      botId: activeAgent?.id,
      botName: activeAgent?.name,
      botAvatar: activeAgent?.avatar,
      botRole: activeAgent?.role,
    }
    let hasSetResponseId = false
    const prevTempNewConversationId = getCurrConversationId() || '-1'
    let tempNewConversationId = ''

    setRespondingTrue()
    sendChatMessage(data, {
      getAbortController: (ac) => {
        setAbortController(ac)
      },
      onData: (msgChunk: string, isFirstMessage: boolean, { conversationId: newConversationId, messageId }: any) => {
        responseItem.content = responseItem.content + msgChunk
        if (isAgentMode) {
          const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
          if (lastThought && !lastThought.tool) {
            lastThought.thought = (lastThought.thought || '') + msgChunk
          }
        }

        if (messageId && !hasSetResponseId) {
          responseItem.id = messageId
          hasSetResponseId = true
        }

        if (newConversationId) {
          tempNewConversationId = newConversationId
          setBotConversationMap(prev => ({
            ...prev,
            [targetBotId]: newConversationId,
          }))
        }

        if (prevTempNewConversationId !== getCurrConversationId()) { return }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      async onCompleted(hasError?: boolean) {
        if (hasError) { return }

        if (getConversationIdChangeBecauseOfNew() || isNew) {
          const res: any = await fetchConversations().catch(() => ({ data: [] }))
          const allConvs: ConversationItem[] = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : []
          if (tempNewConversationId) {
            try {
              const nameRes: any = await generationConversationName(tempNewConversationId, targetBotId)
              const idx = allConvs.findIndex(c => c.id === tempNewConversationId)
              if (idx !== -1 && nameRes?.name) {
                allConvs[idx].name = nameRes.name
              }
            }
            catch {
              // ignore
            }
          }
          setConversationList(allConvs)
        }
        setConversationIdChangeBecauseOfNew(false)
        resetNewConversationInputs()
        setChatNotStarted()
        if (tempNewConversationId) {
          setCurrConversationId(tempNewConversationId, APP_ID, true)
        }
        setRespondingFalse()
      },
      onFile(file) {
        const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
        if (lastThought) { lastThought.message_files = [...(lastThought as any).message_files, { ...file }] }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onThought(thought) {
        isAgentMode = true
        const response = responseItem as any
        if (thought.message_id && !hasSetResponseId) {
          response.id = thought.message_id
          hasSetResponseId = true
        }
        if (response.agent_thoughts.length === 0) {
          response.agent_thoughts.push(thought)
        }
        else {
          const lastThought = response.agent_thoughts[response.agent_thoughts.length - 1]
          if (lastThought.id === thought.id) {
            thought.thought = lastThought.thought
            thought.message_files = lastThought.message_files
            responseItem.agent_thoughts![response.agent_thoughts.length - 1] = thought
          }
          else {
            responseItem.agent_thoughts!.push(thought)
          }
        }

        if (prevTempNewConversationId !== getCurrConversationId()) { return }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onMessageEnd: (messageEnd) => {
        if (messageEnd.metadata?.annotation_reply) {
          responseItem.id = messageEnd.id
          responseItem.annotation = ({
            id: messageEnd.metadata.annotation_reply.id,
            authorName: messageEnd.metadata.annotation_reply.account.name,
          } as AnnotationType)
        }
        const newListWithAnswer = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }
            draft.push({ ...responseItem })
          },
        )
        setChatList(newListWithAnswer)
      },
      onMessageReplace: (messageReplace) => {
        setChatList(produce(
          getChatList(),
          (draft) => {
            const current = draft.find(item => item.id === messageReplace.id)
            if (current) { current.content = messageReplace.answer }
          },
        ))
      },
      onError() {
        setRespondingFalse()
        setChatList(produce(getChatList(), (draft) => {
          draft.splice(draft.findIndex(item => item.id === placeholderAnswerId), 1)
        }))
      },
      onWorkflowStarted: ({ workflow_run_id }) => {
        responseItem.workflow_run_id = workflow_run_id
        responseItem.workflowProcess = {
          status: WorkflowRunningStatus.Running,
          tracing: [],
        }
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          if (currentIndex !== -1) { draft[currentIndex] = { ...draft[currentIndex], ...responseItem } }
        }))
      },
      onWorkflowFinished: ({ data }) => {
        if (responseItem.workflowProcess) { responseItem.workflowProcess.status = data.status as WorkflowRunningStatus }
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          if (currentIndex !== -1) { draft[currentIndex] = { ...draft[currentIndex], ...responseItem } }
        }))
      },
      onNodeStarted: ({ data }) => {
        responseItem.workflowProcess?.tracing?.push(data as any)
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          if (currentIndex !== -1) { draft[currentIndex] = { ...draft[currentIndex], ...responseItem } }
        }))
      },
      onNodeFinished: ({ data }) => {
        if (responseItem.workflowProcess?.tracing) {
          const currentIndex = responseItem.workflowProcess.tracing.findIndex(item => item.node_id === data.node_id)
          if (currentIndex !== -1) { responseItem.workflowProcess.tracing[currentIndex] = data as any }
        }
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          if (currentIndex !== -1) { draft[currentIndex] = { ...draft[currentIndex], ...responseItem } }
        }))
      },
    })
  }

  const handleFeedback = async (messageId: string, feedback: Feedbacktype) => {
    await updateFeedback({ url: `/messages/${messageId}/feedbacks`, body: { rating: feedback.rating } })
    const newChatList = chatList.map((item) => {
      if (item.id === messageId) { return { ...item, feedback } }
      return item
    })
    setChatList(newChatList)
    notify({ type: 'success', message: t('common.api.success') })
  }

  const handleAddUrl = () => {
    if (urlInput.trim()) {
      handleSend(`Analiza y extrae el contenido de esta URL: ${urlInput.trim()}`)
      setUrlInput('')
      setShowUrlModal(false)
    }
  }

  if (authChecking) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070A12] text-slate-100 font-sans select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#090D18] border border-slate-700/60 p-2.5 shadow-xl animate-pulse">
            <img
              src="https://studioalvarodiaz.es/wp-content/uploads/2026/07/ICONO-simbolo-del-vortice.png"
              alt="Álvaro Díaz Studio"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">Conectando con Álvaro Díaz Studio...</span>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user)
          notify({ type: 'success', message: `¡Bienvenido ${user.name}!` })
        }}
      />
    )
  }

  if (appUnavailable) {
    return <AppUnavailable isUnknownReason={isUnknownReason} errMessage={!hasSetAppConfig ? 'Please set APP_ID and API_KEY in config/index.tsx' : ''} />
  }

  if (!APP_ID || !APP_INFO || !promptConfig) {
    return <Loading type="app" />
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-300 ${
      darkMode ? 'bg-[#090D14] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
    }`}>
      {/* ========================================================= */}
      {/* SIDEBAR: PANEL DE NAVEGACIÓN Y CONVERSACIONES           */}
      {/* ========================================================= */}
      <Sidebar
        list={conversationList}
        currentId={currConversationId}
        onCurrentIdChange={handleConversationIdChange}
        onNewChat={() => handleConversationIdChange('-1')}
        onDeleteChat={handleDeleteChat}
        darkMode={darkMode}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onCloseSidebarMobile={() => setSidebarOpen(false)}
        onOpenSettings={() => setShowSettings(true)}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        copyRight={APP_INFO.copyright || APP_INFO.title}
        customization={customization}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Overlay oscuro para móviles cuando el sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* CANVAS PRINCIPAL DEL CHAT                                */}
      {/* ========================================================= */}
      <main className="flex flex-1 flex-col h-full min-w-0 relative overflow-hidden">
        {/* Barra Superior del Canvas */}
        <header
          className={`flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 border-b z-10 backdrop-blur-md transition-colors shrink-0 ${
            darkMode ? 'border-slate-800/80 bg-[#090D14]/80' : 'border-slate-200/80 bg-white/80'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Botón Abrir Menú Lateral en Móvil */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`md:hidden p-1.5 rounded-xl border transition-colors shrink-0 ${
                darkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Abrir historial de conversaciones"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex flex-col min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold truncate">
                {conversationName}
              </h2>
            </div>

            {/* Badge Estado Studio */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono shrink-0 select-none border ${
              darkMode
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse"></span>
              <span className="font-semibold">Studio</span>
            </div>
          </div>

          {/* Acciones Rápidas del Header */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Botón Modo Voz Directo */}
            <button
              onClick={() => setShowVoiceOrb(true)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all shadow-sm ${
                darkMode
                  ? 'bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400/60'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 border border-amber-400 shadow-amber-500/20 hover:shadow-md'
              }`}
            >
              <Headphones className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">Modo Voz Directo</span>
              <span className="md:hidden">Voz</span>
            </button>

            {/* Selector de Tema Claro / Oscuro */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-1.5 sm:p-2 rounded-lg border transition-colors ${
                darkMode
                  ? 'border-slate-800 hover:bg-slate-800 text-amber-400'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Feed de Mensajes y Dock de Entrada */}
        <Chat
          chatList={chatList}
          onSend={handleSend}
          onStop={handleStop}
          onFeedback={handleFeedback}
          isResponding={isResponding}
          darkMode={darkMode}
          activeAgent={activeAgent}
          agentsList={visibleAgents}
          onSelectAgent={handleSelectAgent}
          isSpeakingMessageId={isSpeakingMessageId}
          onSpeakToggle={speakText}
          isRecordingAudio={isRecordingAudio}
          onToggleSpeechRecognition={toggleSpeechRecognition}
          onOpenUrlModal={() => setShowUrlModal(true)}
          visionConfig={visionConfig}
          fileConfig={fileConfig}
          inputText={inputText}
          setInputText={setInputText}
          customization={customization}
        />
      </main>

      {/* ========================================================= */}
      {/* MODAL: MODO DE VOZ REAL TIME (ORBE DINÁMICO)             */}
      {/* ========================================================= */}
      {showVoiceOrb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className={`relative w-full max-w-lg rounded-3xl p-8 text-center border shadow-2xl ${
            darkMode ? 'bg-[#0A0E17] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setShowVoiceOrb(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-800 text-slate-400"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Canal de Audio Bidireccional</span>
                <h3 className="text-xl font-bold mt-1">Asistente Ejecutivo en Vivo</h3>
                <p className="text-xs text-slate-400 mt-1">Conectado a Reconocimiento de Voz + Motor de Conocimiento Dify</p>
              </div>

              {/* Orbe Visual Interactivo */}
              <div className="py-8 flex justify-center items-center">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-40 w-40 rounded-full bg-emerald-500/20 animate-ping"></div>
                  <div className="absolute h-32 w-32 rounded-full bg-amber-500/20 animate-pulse"></div>
                  <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                    <Radio className="h-10 w-10 text-slate-950 animate-bounce" />
                  </div>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-300 italic">
                &quot;Te escucho Álvaro, habla naturalmente para actualizar clientes o revisar métricas...&quot;
              </p>

              <div className="flex justify-center gap-4 pt-4">
                <button
                  onClick={() => setShowVoiceOrb(false)}
                  className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30"
                >
                  Finalizar Sesión de Voz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INGESTA DE URL / PÁGINA WEB                        */}
      {/* ========================================================= */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl ${
            darkMode ? 'bg-[#0E1422] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-400" /> Analizar Enlace o Documento Online
            </h3>
            <p className="text-xs text-slate-400 mt-1">El agente extraerá el contenido web para usarlo en la conversación.</p>

            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://ejemplo.com/propuesta-o-articulo"
              className={`w-full mt-4 px-3 py-2 rounded-xl text-xs outline-none border ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowUrlModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddUrl}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              >
                Adjuntar URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PERSONALIZACIÓN & AJUSTES DEL SISTEMA              */}
      {/* ========================================================= */}
      <CustomizationModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        customization={customization}
        onSave={handleSaveCustomization}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
      />
    </div>
  )
}

export default React.memo(Main)
