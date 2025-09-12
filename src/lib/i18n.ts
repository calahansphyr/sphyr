import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'ar';

export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  currency: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}

export const supportedLocales: Record<SupportedLocale, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
    numberFormat: {
      decimal: '.',
      thousands: ','
    }
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'EUR',
    numberFormat: {
      decimal: ',',
      thousands: '.'
    }
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'EUR',
    numberFormat: {
      decimal: ',',
      thousands: ' '
    }
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    currency: 'EUR',
    numberFormat: {
      decimal: ',',
      thousands: '.'
    }
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'EUR',
    numberFormat: {
      decimal: ',',
      thousands: '.'
    }
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'BRL',
    numberFormat: {
      decimal: ',',
      thousands: '.'
    }
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24h',
    currency: 'JPY',
    numberFormat: {
      decimal: '.',
      thousands: ','
    }
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    direction: 'ltr',
    dateFormat: 'YYYY.MM.DD',
    timeFormat: '24h',
    currency: 'KRW',
    numberFormat: {
      decimal: '.',
      thousands: ','
    }
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    direction: 'ltr',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24h',
    currency: 'CNY',
    numberFormat: {
      decimal: '.',
      thousands: ','
    }
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'SAR',
    numberFormat: {
      decimal: '.',
      thousands: ','
    }
  }
};

export interface Translations {
  // Navigation
  nav: {
    dashboard: string;
    search: string;
    integrations: string;
    settings: string;
    help: string;
  };
  
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    add: string;
    remove: string;
    search: string;
    filter: string;
    sort: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    reset: string;
    confirm: string;
    yes: string;
    no: string;
    ok: string;
  };
  
  // Search
  search: {
    placeholder: string;
    noResults: string;
    searchResults: string;
    filters: string;
    sortBy: string;
    relevance: string;
    date: string;
    confidence: string;
    source: string;
  };
  
  // Integrations
  integrations: {
    title: string;
    connect: string;
    disconnect: string;
    connected: string;
    disconnected: string;
    syncing: string;
    error: string;
    lastSync: string;
    itemCount: string;
  };
  
  // Errors
  errors: {
    generic: string;
    network: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    serverError: string;
    validation: string;
    timeout: string;
  };
  
  // Accessibility
  a11y: {
    skipToContent: string;
    closeModal: string;
    openMenu: string;
    closeMenu: string;
    nextPage: string;
    previousPage: string;
    loading: string;
    error: string;
    success: string;
    required: string;
    optional: string;
  };
}

export const translations: Record<SupportedLocale, Translations> = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      search: 'Search',
      integrations: 'Integrations',
      settings: 'Settings',
      help: 'Help'
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      remove: 'Remove',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      reset: 'Reset',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      ok: 'OK'
    },
    search: {
      placeholder: 'Search across all platforms...',
      noResults: 'No results found',
      searchResults: 'Search Results',
      filters: 'Filters',
      sortBy: 'Sort by',
      relevance: 'Relevance',
      date: 'Date',
      confidence: 'Confidence',
      source: 'Source'
    },
    integrations: {
      title: 'Integrations',
      connect: 'Connect',
      disconnect: 'Disconnect',
      connected: 'Connected',
      disconnected: 'Disconnected',
      syncing: 'Syncing',
      error: 'Error',
      lastSync: 'Last sync',
      itemCount: 'Items'
    },
    errors: {
      generic: 'Something went wrong',
      network: 'Network error',
      unauthorized: 'Unauthorized',
      forbidden: 'Forbidden',
      notFound: 'Not found',
      serverError: 'Server error',
      validation: 'Validation error',
      timeout: 'Request timeout'
    },
    a11y: {
      skipToContent: 'Skip to main content',
      closeModal: 'Close modal',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      nextPage: 'Next page',
      previousPage: 'Previous page',
      loading: 'Loading',
      error: 'Error',
      success: 'Success',
      required: 'Required',
      optional: 'Optional'
    }
  },
  es: {
    nav: {
      dashboard: 'Panel',
      search: 'Buscar',
      integrations: 'Integraciones',
      settings: 'Configuración',
      help: 'Ayuda'
    },
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      add: 'Agregar',
      remove: 'Quitar',
      search: 'Buscar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      close: 'Cerrar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      submit: 'Enviar',
      reset: 'Restablecer',
      confirm: 'Confirmar',
      yes: 'Sí',
      no: 'No',
      ok: 'OK'
    },
    search: {
      placeholder: 'Buscar en todas las plataformas...',
      noResults: 'No se encontraron resultados',
      searchResults: 'Resultados de búsqueda',
      filters: 'Filtros',
      sortBy: 'Ordenar por',
      relevance: 'Relevancia',
      date: 'Fecha',
      confidence: 'Confianza',
      source: 'Fuente'
    },
    integrations: {
      title: 'Integraciones',
      connect: 'Conectar',
      disconnect: 'Desconectar',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      syncing: 'Sincronizando',
      error: 'Error',
      lastSync: 'Última sincronización',
      itemCount: 'Elementos'
    },
    errors: {
      generic: 'Algo salió mal',
      network: 'Error de red',
      unauthorized: 'No autorizado',
      forbidden: 'Prohibido',
      notFound: 'No encontrado',
      serverError: 'Error del servidor',
      validation: 'Error de validación',
      timeout: 'Tiempo de espera agotado'
    },
    a11y: {
      skipToContent: 'Saltar al contenido principal',
      closeModal: 'Cerrar modal',
      openMenu: 'Abrir menú',
      closeMenu: 'Cerrar menú',
      nextPage: 'Página siguiente',
      previousPage: 'Página anterior',
      loading: 'Cargando',
      error: 'Error',
      success: 'Éxito',
      required: 'Requerido',
      optional: 'Opcional'
    }
  },
  fr: {
    nav: {
      dashboard: 'Tableau de bord',
      search: 'Recherche',
      integrations: 'Intégrations',
      settings: 'Paramètres',
      help: 'Aide'
    },
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      cancel: 'Annuler',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
      remove: 'Retirer',
      search: 'Rechercher',
      filter: 'Filtrer',
      sort: 'Trier',
      close: 'Fermer',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      submit: 'Soumettre',
      reset: 'Réinitialiser',
      confirm: 'Confirmer',
      yes: 'Oui',
      no: 'Non',
      ok: 'OK'
    },
    search: {
      placeholder: 'Rechercher sur toutes les plateformes...',
      noResults: 'Aucun résultat trouvé',
      searchResults: 'Résultats de recherche',
      filters: 'Filtres',
      sortBy: 'Trier par',
      relevance: 'Pertinence',
      date: 'Date',
      confidence: 'Confiance',
      source: 'Source'
    },
    integrations: {
      title: 'Intégrations',
      connect: 'Connecter',
      disconnect: 'Déconnecter',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      syncing: 'Synchronisation',
      error: 'Erreur',
      lastSync: 'Dernière synchronisation',
      itemCount: 'Éléments'
    },
    errors: {
      generic: 'Quelque chose s\'est mal passé',
      network: 'Erreur réseau',
      unauthorized: 'Non autorisé',
      forbidden: 'Interdit',
      notFound: 'Non trouvé',
      serverError: 'Erreur serveur',
      validation: 'Erreur de validation',
      timeout: 'Délai d\'attente dépassé'
    },
    a11y: {
      skipToContent: 'Aller au contenu principal',
      closeModal: 'Fermer la fenêtre',
      openMenu: 'Ouvrir le menu',
      closeMenu: 'Fermer le menu',
      nextPage: 'Page suivante',
      previousPage: 'Page précédente',
      loading: 'Chargement',
      error: 'Erreur',
      success: 'Succès',
      required: 'Requis',
      optional: 'Optionnel'
    }
  },
  de: {
    nav: {
      dashboard: 'Dashboard',
      search: 'Suchen',
      integrations: 'Integrationen',
      settings: 'Einstellungen',
      help: 'Hilfe'
    },
    common: {
      loading: 'Laden...',
      error: 'Fehler',
      success: 'Erfolg',
      cancel: 'Abbrechen',
      save: 'Speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      add: 'Hinzufügen',
      remove: 'Entfernen',
      search: 'Suchen',
      filter: 'Filtern',
      sort: 'Sortieren',
      close: 'Schließen',
      back: 'Zurück',
      next: 'Weiter',
      previous: 'Vorherige',
      submit: 'Absenden',
      reset: 'Zurücksetzen',
      confirm: 'Bestätigen',
      yes: 'Ja',
      no: 'Nein',
      ok: 'OK'
    },
    search: {
      placeholder: 'Über alle Plattformen suchen...',
      noResults: 'Keine Ergebnisse gefunden',
      searchResults: 'Suchergebnisse',
      filters: 'Filter',
      sortBy: 'Sortieren nach',
      relevance: 'Relevanz',
      date: 'Datum',
      confidence: 'Vertrauen',
      source: 'Quelle'
    },
    integrations: {
      title: 'Integrationen',
      connect: 'Verbinden',
      disconnect: 'Trennen',
      connected: 'Verbunden',
      disconnected: 'Getrennt',
      syncing: 'Synchronisierung',
      error: 'Fehler',
      lastSync: 'Letzte Synchronisierung',
      itemCount: 'Elemente'
    },
    errors: {
      generic: 'Etwas ist schief gelaufen',
      network: 'Netzwerkfehler',
      unauthorized: 'Nicht autorisiert',
      forbidden: 'Verboten',
      notFound: 'Nicht gefunden',
      serverError: 'Serverfehler',
      validation: 'Validierungsfehler',
      timeout: 'Zeitüberschreitung'
    },
    a11y: {
      skipToContent: 'Zum Hauptinhalt springen',
      closeModal: 'Modal schließen',
      openMenu: 'Menü öffnen',
      closeMenu: 'Menü schließen',
      nextPage: 'Nächste Seite',
      previousPage: 'Vorherige Seite',
      loading: 'Laden',
      error: 'Fehler',
      success: 'Erfolg',
      required: 'Erforderlich',
      optional: 'Optional'
    }
  },
  it: {
    nav: {
      dashboard: 'Dashboard',
      search: 'Cerca',
      integrations: 'Integrazioni',
      settings: 'Impostazioni',
      help: 'Aiuto'
    },
    common: {
      loading: 'Caricamento...',
      error: 'Errore',
      success: 'Successo',
      cancel: 'Annulla',
      save: 'Salva',
      delete: 'Elimina',
      edit: 'Modifica',
      add: 'Aggiungi',
      remove: 'Rimuovi',
      search: 'Cerca',
      filter: 'Filtra',
      sort: 'Ordina',
      close: 'Chiudi',
      back: 'Indietro',
      next: 'Avanti',
      previous: 'Precedente',
      submit: 'Invia',
      reset: 'Reimposta',
      confirm: 'Conferma',
      yes: 'Sì',
      no: 'No',
      ok: 'OK'
    },
    search: {
      placeholder: 'Cerca su tutte le piattaforme...',
      noResults: 'Nessun risultato trovato',
      searchResults: 'Risultati di ricerca',
      filters: 'Filtri',
      sortBy: 'Ordina per',
      relevance: 'Rilevanza',
      date: 'Data',
      confidence: 'Confidenza',
      source: 'Fonte'
    },
    integrations: {
      title: 'Integrazioni',
      connect: 'Connetti',
      disconnect: 'Disconnetti',
      connected: 'Connesso',
      disconnected: 'Disconnesso',
      syncing: 'Sincronizzazione',
      error: 'Errore',
      lastSync: 'Ultima sincronizzazione',
      itemCount: 'Elementi'
    },
    errors: {
      generic: 'Qualcosa è andato storto',
      network: 'Errore di rete',
      unauthorized: 'Non autorizzato',
      forbidden: 'Vietato',
      notFound: 'Non trovato',
      serverError: 'Errore del server',
      validation: 'Errore di validazione',
      timeout: 'Timeout della richiesta'
    },
    a11y: {
      skipToContent: 'Vai al contenuto principale',
      closeModal: 'Chiudi modale',
      openMenu: 'Apri menu',
      closeMenu: 'Chiudi menu',
      nextPage: 'Pagina successiva',
      previousPage: 'Pagina precedente',
      loading: 'Caricamento',
      error: 'Errore',
      success: 'Successo',
      required: 'Richiesto',
      optional: 'Opzionale'
    }
  },
  pt: {
    nav: {
      dashboard: 'Painel',
      search: 'Pesquisar',
      integrations: 'Integrações',
      settings: 'Configurações',
      help: 'Ajuda'
    },
    common: {
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      cancel: 'Cancelar',
      save: 'Salvar',
      delete: 'Excluir',
      edit: 'Editar',
      add: 'Adicionar',
      remove: 'Remover',
      search: 'Pesquisar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      close: 'Fechar',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
      submit: 'Enviar',
      reset: 'Redefinir',
      confirm: 'Confirmar',
      yes: 'Sim',
      no: 'Não',
      ok: 'OK'
    },
    search: {
      placeholder: 'Pesquisar em todas as plataformas...',
      noResults: 'Nenhum resultado encontrado',
      searchResults: 'Resultados da pesquisa',
      filters: 'Filtros',
      sortBy: 'Ordenar por',
      relevance: 'Relevância',
      date: 'Data',
      confidence: 'Confiança',
      source: 'Fonte'
    },
    integrations: {
      title: 'Integrações',
      connect: 'Conectar',
      disconnect: 'Desconectar',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      syncing: 'Sincronizando',
      error: 'Erro',
      lastSync: 'Última sincronização',
      itemCount: 'Itens'
    },
    errors: {
      generic: 'Algo deu errado',
      network: 'Erro de rede',
      unauthorized: 'Não autorizado',
      forbidden: 'Proibido',
      notFound: 'Não encontrado',
      serverError: 'Erro do servidor',
      validation: 'Erro de validação',
      timeout: 'Tempo limite esgotado'
    },
    a11y: {
      skipToContent: 'Pular para o conteúdo principal',
      closeModal: 'Fechar modal',
      openMenu: 'Abrir menu',
      closeMenu: 'Fechar menu',
      nextPage: 'Próxima página',
      previousPage: 'Página anterior',
      loading: 'Carregando',
      error: 'Erro',
      success: 'Sucesso',
      required: 'Obrigatório',
      optional: 'Opcional'
    }
  },
  ja: {
    nav: {
      dashboard: 'ダッシュボード',
      search: '検索',
      integrations: '統合',
      settings: '設定',
      help: 'ヘルプ'
    },
    common: {
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      cancel: 'キャンセル',
      save: '保存',
      delete: '削除',
      edit: '編集',
      add: '追加',
      remove: '削除',
      search: '検索',
      filter: 'フィルター',
      sort: '並び替え',
      close: '閉じる',
      back: '戻る',
      next: '次へ',
      previous: '前へ',
      submit: '送信',
      reset: 'リセット',
      confirm: '確認',
      yes: 'はい',
      no: 'いいえ',
      ok: 'OK'
    },
    search: {
      placeholder: 'すべてのプラットフォームで検索...',
      noResults: '結果が見つかりません',
      searchResults: '検索結果',
      filters: 'フィルター',
      sortBy: '並び替え',
      relevance: '関連性',
      date: '日付',
      confidence: '信頼度',
      source: 'ソース'
    },
    integrations: {
      title: '統合',
      connect: '接続',
      disconnect: '切断',
      connected: '接続済み',
      disconnected: '切断済み',
      syncing: '同期中',
      error: 'エラー',
      lastSync: '最終同期',
      itemCount: 'アイテム'
    },
    errors: {
      generic: '何かが間違っています',
      network: 'ネットワークエラー',
      unauthorized: '認証されていません',
      forbidden: '禁止されています',
      notFound: '見つかりません',
      serverError: 'サーバーエラー',
      validation: '検証エラー',
      timeout: 'タイムアウト'
    },
    a11y: {
      skipToContent: 'メインコンテンツにスキップ',
      closeModal: 'モーダルを閉じる',
      openMenu: 'メニューを開く',
      closeMenu: 'メニューを閉じる',
      nextPage: '次のページ',
      previousPage: '前のページ',
      loading: '読み込み中',
      error: 'エラー',
      success: '成功',
      required: '必須',
      optional: 'オプション'
    }
  },
  ko: {
    nav: {
      dashboard: '대시보드',
      search: '검색',
      integrations: '통합',
      settings: '설정',
      help: '도움말'
    },
    common: {
      loading: '로딩 중...',
      error: '오류',
      success: '성공',
      cancel: '취소',
      save: '저장',
      delete: '삭제',
      edit: '편집',
      add: '추가',
      remove: '제거',
      search: '검색',
      filter: '필터',
      sort: '정렬',
      close: '닫기',
      back: '뒤로',
      next: '다음',
      previous: '이전',
      submit: '제출',
      reset: '재설정',
      confirm: '확인',
      yes: '예',
      no: '아니오',
      ok: '확인'
    },
    search: {
      placeholder: '모든 플랫폼에서 검색...',
      noResults: '결과를 찾을 수 없습니다',
      searchResults: '검색 결과',
      filters: '필터',
      sortBy: '정렬 기준',
      relevance: '관련성',
      date: '날짜',
      confidence: '신뢰도',
      source: '소스'
    },
    integrations: {
      title: '통합',
      connect: '연결',
      disconnect: '연결 해제',
      connected: '연결됨',
      disconnected: '연결 해제됨',
      syncing: '동기화 중',
      error: '오류',
      lastSync: '마지막 동기화',
      itemCount: '항목'
    },
    errors: {
      generic: '문제가 발생했습니다',
      network: '네트워크 오류',
      unauthorized: '인증되지 않음',
      forbidden: '금지됨',
      notFound: '찾을 수 없음',
      serverError: '서버 오류',
      validation: '검증 오류',
      timeout: '요청 시간 초과'
    },
    a11y: {
      skipToContent: '메인 콘텐츠로 건너뛰기',
      closeModal: '모달 닫기',
      openMenu: '메뉴 열기',
      closeMenu: '메뉴 닫기',
      nextPage: '다음 페이지',
      previousPage: '이전 페이지',
      loading: '로딩 중',
      error: '오류',
      success: '성공',
      required: '필수',
      optional: '선택사항'
    }
  },
  zh: {
    nav: {
      dashboard: '仪表板',
      search: '搜索',
      integrations: '集成',
      settings: '设置',
      help: '帮助'
    },
    common: {
      loading: '加载中...',
      error: '错误',
      success: '成功',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      add: '添加',
      remove: '移除',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
      close: '关闭',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      submit: '提交',
      reset: '重置',
      confirm: '确认',
      yes: '是',
      no: '否',
      ok: '确定'
    },
    search: {
      placeholder: '在所有平台中搜索...',
      noResults: '未找到结果',
      searchResults: '搜索结果',
      filters: '筛选器',
      sortBy: '排序方式',
      relevance: '相关性',
      date: '日期',
      confidence: '置信度',
      source: '来源'
    },
    integrations: {
      title: '集成',
      connect: '连接',
      disconnect: '断开连接',
      connected: '已连接',
      disconnected: '已断开',
      syncing: '同步中',
      error: '错误',
      lastSync: '最后同步',
      itemCount: '项目'
    },
    errors: {
      generic: '出现错误',
      network: '网络错误',
      unauthorized: '未授权',
      forbidden: '禁止访问',
      notFound: '未找到',
      serverError: '服务器错误',
      validation: '验证错误',
      timeout: '请求超时'
    },
    a11y: {
      skipToContent: '跳转到主要内容',
      closeModal: '关闭模态框',
      openMenu: '打开菜单',
      closeMenu: '关闭菜单',
      nextPage: '下一页',
      previousPage: '上一页',
      loading: '加载中',
      error: '错误',
      success: '成功',
      required: '必填',
      optional: '可选'
    }
  },
  ar: {
    nav: {
      dashboard: 'لوحة التحكم',
      search: 'بحث',
      integrations: 'التكاملات',
      settings: 'الإعدادات',
      help: 'المساعدة'
    },
    common: {
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      add: 'إضافة',
      remove: 'إزالة',
      search: 'بحث',
      filter: 'تصفية',
      sort: 'ترتيب',
      close: 'إغلاق',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      submit: 'إرسال',
      reset: 'إعادة تعيين',
      confirm: 'تأكيد',
      yes: 'نعم',
      no: 'لا',
      ok: 'موافق'
    },
    search: {
      placeholder: 'البحث في جميع المنصات...',
      noResults: 'لم يتم العثور على نتائج',
      searchResults: 'نتائج البحث',
      filters: 'المرشحات',
      sortBy: 'ترتيب حسب',
      relevance: 'الصلة',
      date: 'التاريخ',
      confidence: 'الثقة',
      source: 'المصدر'
    },
    integrations: {
      title: 'التكاملات',
      connect: 'اتصال',
      disconnect: 'قطع الاتصال',
      connected: 'متصل',
      disconnected: 'غير متصل',
      syncing: 'مزامنة',
      error: 'خطأ',
      lastSync: 'آخر مزامنة',
      itemCount: 'العناصر'
    },
    errors: {
      generic: 'حدث خطأ ما',
      network: 'خطأ في الشبكة',
      unauthorized: 'غير مخول',
      forbidden: 'محظور',
      notFound: 'غير موجود',
      serverError: 'خطأ في الخادم',
      validation: 'خطأ في التحقق',
      timeout: 'انتهت مهلة الطلب'
    },
    a11y: {
      skipToContent: 'انتقل إلى المحتوى الرئيسي',
      closeModal: 'إغلاق النافذة المنبثقة',
      openMenu: 'فتح القائمة',
      closeMenu: 'إغلاق القائمة',
      nextPage: 'الصفحة التالية',
      previousPage: 'الصفحة السابقة',
      loading: 'جاري التحميل',
      error: 'خطأ',
      success: 'نجح',
      required: 'مطلوب',
      optional: 'اختياري'
    }
  }
};

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string) => string;
  formatDate: (date: Date) => string;
  formatNumber: (number: number) => string;
  formatCurrency: (amount: number) => string;
  direction: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: SupportedLocale;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLocale = 'en'
}) => {
  const [locale, setLocale] = useState<SupportedLocale>(defaultLocale);
  const localeConfig = supportedLocales[locale];
  const translation = translations[locale];

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translation;
    
    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = undefined;
        break;
      }
    }
    
    return (typeof value === 'string' || typeof value === 'number') ? String(value) : key;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  const formatNumber = (number: number): string => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(number);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: localeConfig.currency
    }).format(amount);
  };

  return React.createElement(
    I18nContext.Provider,
    {
      value: {
        locale,
        setLocale,
        t,
        formatDate,
        formatNumber,
        formatCurrency,
        direction: localeConfig.direction
      }
    },
    React.createElement(
      'div',
      { dir: localeConfig.direction, lang: locale },
      children
    )
  );
};

const I18nComponents = {
  I18nProvider,
  useI18n,
  supportedLocales,
  translations
};

export default I18nComponents;
