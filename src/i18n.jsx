import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const LANGUAGE_STORAGE_KEY = 'supporthub-language'
const DEFAULT_LANGUAGE = 'pl'

export const translations = {
  pl: {
    meta: { locale: 'pl-PL', currency: 'PLN' },
    common: {
      languageNames: { pl: 'Polski', en: 'English' },
      languageShort: { pl: 'PL', en: 'EN' },
      statuses: {
        nowe: 'Nowe',
        wtrakcie: 'W trakcie',
        czeka: 'Czeka na części',
        zakonczone: 'Zakończone',
        odeslane: 'Odesłane',
      },
      jobTypes: {
        hub: 'Naprawa w hubie',
        onsite: 'Naprawa u klienta',
        upgrade: 'Upgrade',
      },
      dispositions: {
        keep: 'pozostaje u mnie',
        dispose: 'utylizacja',
        renew: 'odnowienie',
        return: 'odesłanie do producenta',
      },
    },
    app: {
      title: 'Serwis Manager',
      subtitle: 'Zlecenia • Magazyn • Raporty',
      tabs: { jobs: 'Zlecenia', inventory: 'Magazyn', reports: 'Raport' },
      footerNotice: 'Dane lokalnie w przeglądarce. Import/Export = kopia/przenoszenie.',
      languageToggle: {
        button: 'PL / EN',
        aria: 'Zmień język na {{language}}',
      },
    },
    emptyState: {
      title: 'Zacznij od dodania firmy',
      description: 'Aplikacja gotowa do pracy. Dodaj firmę, a potem twórz zlecenia i zarządzaj magazynem.',
      loadDemo: 'Wczytaj dane przykładowe',
    },
    companySwitcher: {
      button: 'Firmy ▾',
      manage: 'Zarządzaj',
      nameLabel: 'Nazwa firmy',
      placeholder: 'np. ACME Sp. z o.o.',
      add: 'Dodaj',
      removeCurrent: 'Usuń bieżącą',
      confirmDelete: 'Usunąć bieżącą firmę? Z danymi!',
    },
    importExport: {
      import: 'Import',
      export: 'Eksport',
      importSuccess: 'Dane zaimportowane',
      invalidFile: 'Nieprawidłowy plik',
      importError: 'Błąd importu: {{error}}',
      fileNamePrefix: 'serwis-manager-backup',
    },
    jobs: {
      titleNew: 'Nowe zlecenie',
      titleEdit: 'Edytuj zlecenie',
      form: {
        orderNumberLabel: 'Numer zlecenia *',
        orderNumberPlaceholder: 'np. ZL-2025-001',
        serialLabel: 'Numer seryjny urządzenia',
        serialPlaceholder: 'np. SN123456',
        issueLabel: 'Opis usterki',
        issuePlaceholder: 'Co się dzieje z urządzeniem?',
        incomingTrackingLabel: 'Tracking (przychodzący)',
        outgoingTrackingLabel: 'Tracking (wychodzący)',
        trackingPlaceholder: 'URL lub numer listu',
        actionsLabel: 'Opis czynności wykonanych',
        actionsPlaceholder: 'Co zostało zrobione?',
        statusLabel: 'Status',
        typeLabel: 'Typ zlecenia',
        dueDateLabel: 'Termin (SLA)',
        shipmentsTitle: 'Koszty przesyłki i ubezpieczenia (PLN)',
        shipmentsInCaption: 'PRZYCHODZĄCA (IN)',
        shipmentsOutCaption: 'WYCHODZĄCA (OUT)',
        shipInLabel: 'Koszt przesyłki (IN)',
        shipOutLabel: 'Koszt przesyłki (OUT)',
        insuranceInLabel: 'Ubezpieczenie (IN)',
        insuranceOutLabel: 'Ubezpieczenie (OUT)',
        shipPlaceholder: 'np. 85.00',
        insurancePlaceholder: 'np. 12.00',
        openLink: 'Otwórz',
        saveButton: 'Zapisz zmiany',
        addButton: 'Dodaj zlecenie',
        cancelButton: 'Anuluj',
      },
      filters: {
        searchPlaceholder: 'Szukaj (nr, SN, opis...)',
        statusAll: 'Wszystkie statusy',
        typeAll: 'Wszystkie typy',
      },
      list: {
        title: 'Lista zleceń',
        columns: {
          number: 'Numer',
          serial: 'SN',
          type: 'Typ',
          sla: 'SLA',
          status: 'Status',
          createdAt: 'Utworzono',
          actions: 'Akcje',
        },
        actionEdit: 'Edytuj',
        actionParts: 'Części',
        actionDelete: 'Usuń',
        empty: 'Brak zleceń spełniających kryteria',
      },
      details: {
        serial: 'SN:',
        issue: 'Usterka:',
        actions: 'Czynności:',
        type: 'Typ:',
        sla: 'Termin (SLA):',
        trackingIn: 'Tracking IN:',
        trackingOut: 'Tracking OUT:',
        updatedAt: 'Ostatnia zmiana:',
        shipmentCosts: 'Koszty przesyłek:',
        inboundLabel: 'IN',
        outboundLabel: 'OUT',
        insuranceShort: 'Ubezp',
        usageTitle: 'Zużyte części:',
        noUsage: 'Brak',
        dispositionPrefix: 'los: {{label}}',
        quantityWithUnit: '{{qty}} szt.',
      },
      usageModal: {
        title: 'Zużycie części',
        selectorLabel: 'Pozycja z magazynu',
        selectorPlaceholder: '— wybierz —',
        quantityLabel: 'Ilość',
        dispositionLabel: 'Los części',
        addButton: 'Dodaj',
        tableHeaders: {
          name: 'Nazwa',
          sku: 'SKU',
          qty: 'Ilość',
          disposition: 'Los',
          actions: '',
        },
        empty: 'Nic nie dodano',
        remove: 'Usuń',
        apply: 'Zapisz i zaktualizuj magazyn',
        cancel: 'Anuluj',
        inventoryOption: '{{name}} (SKU: {{sku}}) — dostępne: {{qty}}',
      },
      alerts: {
        orderNumberRequired: 'Podaj numer zlecenia',
      },
      confirm: {
        delete: 'Usunąć zlecenie?',
      },
    },
    inventory: {
      formTitle: 'Dodaj pozycję',
      nameLabel: 'Nazwa *',
      namePlaceholder: 'np. Moduł A / Kondensator 100uF',
      skuLabel: 'SKU / indeks',
      skuPlaceholder: 'np. KND-100',
      qtyLabel: 'Ilość początkowa',
      locationLabel: 'Lokalizacja',
      locationPlaceholder: 'np. Regał A3',
      minQtyLabel: 'Stan minimalny',
      addButton: 'Dodaj do magazynu',
      searchPlaceholder: 'Szukaj w magazynie',
      tableTitle: 'Stan magazynu',
      columns: {
        name: 'Nazwa',
        sku: 'SKU',
        location: 'Lokalizacja',
        qty: 'Stan',
        min: 'Min',
        actions: 'Akcje',
      },
      lowStockBadge: 'Niski stan',
      empty: 'Magazyn pusty',
      increment: '+1',
      decrement: '-1',
      remove: 'Usuń',
      alerts: {
        nameRequired: 'Podaj nazwę pozycji',
      },
      confirm: {
        delete: 'Usunąć pozycję z magazynu?',
      },
    },
    repairQueue: {
      title: 'Kolejka części',
      columns: {
        date: 'Data',
        job: 'Zlecenie',
        part: 'Część',
        sku: 'SKU',
        qty: 'Ilość',
        disposition: 'Los',
        actions: 'Akcje',
      },
      empty: 'Kolejka pusta',
      actions: {
        ok: 'OK',
        bad: 'BAD',
        return: 'Odesłano',
      },
    },
    reports: {
      dateRangeTitle: 'Zakres dat',
      fromLabel: 'Od',
      toLabel: 'Do',
      jobsSummaryTitle: 'Podsumowanie zleceń',
      jobsSummary: {
        totalPrefix: 'Łącznie (w zakresie):',
      },
      partsSummaryTitle: 'Podsumowanie części',
      partsSummary: {
        totalPrefix: 'Łącznie użytych (szt.):',
        keptLabel: 'Pozostały u mnie',
        disposedLabel: 'Utylizacja',
        disposalEventsLabel: 'Utylizacje',
        returnEventsLabel: 'Odesłania',
        renewEventsLabel: 'Odnowienia (liczba pozycji)',
      },
      shipmentsTitle: 'Koszty przesyłek (PLN)',
      shipments: {
        shipmentLabel: 'Przesyłka',
        insuranceLabel: 'Ubezpieczenie',
        totalLabel: 'Razem:',
      },
      modal: {
        noResults: 'Brak wyników',
        close: 'Zamknij',
        jobsTitle: 'Zlecenia — {{label}}',
        partsTitle: 'Części — {{label}}',
        jobStatusPrefix: 'Status: {{status}}',
        jobTypePrefix: 'Typ: {{type}}',
        jobCreatedAt: 'Utworzono: {{date}}',
        jobFallbackTitle: 'Zlecenie {{id}}',
        partQty: 'Ilość: {{qty}}',
        partDisposition: 'Los: {{label}}',
        partJob: 'Zlecenie: {{job}}',
        partDate: 'Data: {{date}}',
        partUnknown: 'Nieznana część',
        jobNoStatus: 'Brak statusu',
        jobNoDate: 'Brak daty',
      },
    },
    demo: {
      companies: {
        first: 'Firma A',
        second: 'Firma B',
      },
      jobs: {
        first: {
          orderNumber: 'ZL-2025-001',
          serialNumber: 'SN12345',
          issue: 'Nie włącza się',
          actions: 'Diagnoza zasilania',
        },
        second: {
          orderNumber: 'ZL-2025-002',
          serialNumber: 'SN55555',
          issue: 'Brak obrazu',
          actions: 'Wymiana kondensatora',
        },
      },
      inventory: {
        capacitor: 'Kondensator 100uF',
        psu: 'Zasilacz 12V',
      },
    },
  },
  en: {
    meta: { locale: 'en-US', currency: 'PLN' },
    common: {
      languageNames: { pl: 'Polish', en: 'English' },
      languageShort: { pl: 'PL', en: 'EN' },
      statuses: {
        nowe: 'New',
        wtrakcie: 'In progress',
        czeka: 'Waiting for parts',
        zakonczone: 'Completed',
        odeslane: 'Shipped back',
      },
      jobTypes: {
        hub: 'Hub repair',
        onsite: 'On-site repair',
        upgrade: 'Upgrade',
      },
      dispositions: {
        keep: 'kept on hand',
        dispose: 'disposed',
        renew: 'refurbished',
        return: 'returned to manufacturer',
      },
    },
    app: {
      title: 'Service Manager',
      subtitle: 'Jobs • Inventory • Reports',
      tabs: { jobs: 'Jobs', inventory: 'Inventory', reports: 'Report' },
      footerNotice: 'Data is stored locally in your browser. Import/Export = copy/migrate.',
      languageToggle: {
        button: 'PL / EN',
        aria: 'Switch language to {{language}}',
      },
    },
    emptyState: {
      title: 'Start by adding a company',
      description: 'The app is ready to go. Add a company, then create jobs and manage inventory.',
      loadDemo: 'Load demo data',
    },
    companySwitcher: {
      button: 'Companies ▾',
      manage: 'Manage',
      nameLabel: 'Company name',
      placeholder: 'e.g. ACME Ltd.',
      add: 'Add',
      removeCurrent: 'Remove current',
      confirmDelete: 'Remove the current company? This will delete its data!',
    },
    importExport: {
      import: 'Import',
      export: 'Export',
      importSuccess: 'Data imported',
      invalidFile: 'Invalid file',
      importError: 'Import failed: {{error}}',
      fileNamePrefix: 'service-manager-backup',
    },
    jobs: {
      titleNew: 'New job',
      titleEdit: 'Edit job',
      form: {
        orderNumberLabel: 'Job number *',
        orderNumberPlaceholder: 'e.g. JOB-2025-001',
        serialLabel: 'Device serial number',
        serialPlaceholder: 'e.g. SN123456',
        issueLabel: 'Issue description',
        issuePlaceholder: 'What is happening with the device?',
        incomingTrackingLabel: 'Tracking (incoming)',
        outgoingTrackingLabel: 'Tracking (outgoing)',
        trackingPlaceholder: 'URL or tracking number',
        actionsLabel: 'Actions performed',
        actionsPlaceholder: 'What was done?',
        statusLabel: 'Status',
        typeLabel: 'Job type',
        dueDateLabel: 'Due date (SLA)',
        shipmentsTitle: 'Shipping and insurance costs (PLN)',
        shipmentsInCaption: 'INBOUND (IN)',
        shipmentsOutCaption: 'OUTBOUND (OUT)',
        shipInLabel: 'Shipping cost (IN)',
        shipOutLabel: 'Shipping cost (OUT)',
        insuranceInLabel: 'Insurance (IN)',
        insuranceOutLabel: 'Insurance (OUT)',
        shipPlaceholder: 'e.g. 85.00',
        insurancePlaceholder: 'e.g. 12.00',
        openLink: 'Open',
        saveButton: 'Save changes',
        addButton: 'Add job',
        cancelButton: 'Cancel',
      },
      filters: {
        searchPlaceholder: 'Search (number, SN, description...)',
        statusAll: 'All statuses',
        typeAll: 'All types',
      },
      list: {
        title: 'Jobs list',
        columns: {
          number: 'Number',
          serial: 'SN',
          type: 'Type',
          sla: 'SLA',
          status: 'Status',
          createdAt: 'Created',
          actions: 'Actions',
        },
        actionEdit: 'Edit',
        actionParts: 'Parts',
        actionDelete: 'Delete',
        empty: 'No jobs match the filters',
      },
      details: {
        serial: 'SN:',
        issue: 'Issue:',
        actions: 'Actions:',
        type: 'Type:',
        sla: 'Due date (SLA):',
        trackingIn: 'Tracking IN:',
        trackingOut: 'Tracking OUT:',
        updatedAt: 'Last updated:',
        shipmentCosts: 'Shipping costs:',
        inboundLabel: 'IN',
        outboundLabel: 'OUT',
        insuranceShort: 'Ins.',
        usageTitle: 'Parts used:',
        noUsage: 'None',
        dispositionPrefix: 'outcome: {{label}}',
        quantityWithUnit: '{{qty}} pcs',
      },
      usageModal: {
        title: 'Parts usage',
        selectorLabel: 'Inventory item',
        selectorPlaceholder: '— select —',
        quantityLabel: 'Quantity',
        dispositionLabel: 'Part outcome',
        addButton: 'Add',
        tableHeaders: {
          name: 'Name',
          sku: 'SKU',
          qty: 'Qty',
          disposition: 'Outcome',
          actions: '',
        },
        empty: 'Nothing added',
        remove: 'Remove',
        apply: 'Save and update inventory',
        cancel: 'Cancel',
        inventoryOption: '{{name}} (SKU: {{sku}}) — available: {{qty}}',
      },
      alerts: {
        orderNumberRequired: 'Provide a job number',
      },
      confirm: {
        delete: 'Delete this job?',
      },
    },
    inventory: {
      formTitle: 'Add item',
      nameLabel: 'Name *',
      namePlaceholder: 'e.g. Module A / Capacitor 100uF',
      skuLabel: 'SKU / index',
      skuPlaceholder: 'e.g. CAP-100',
      qtyLabel: 'Initial quantity',
      locationLabel: 'Location',
      locationPlaceholder: 'e.g. Shelf A3',
      minQtyLabel: 'Minimum stock',
      addButton: 'Add to inventory',
      searchPlaceholder: 'Search inventory',
      tableTitle: 'Inventory levels',
      columns: {
        name: 'Name',
        sku: 'SKU',
        location: 'Location',
        qty: 'Stock',
        min: 'Min',
        actions: 'Actions',
      },
      lowStockBadge: 'Low stock',
      empty: 'Inventory is empty',
      increment: '+1',
      decrement: '-1',
      remove: 'Delete',
      alerts: {
        nameRequired: 'Provide an item name',
      },
      confirm: {
        delete: 'Remove this inventory item?',
      },
    },
    repairQueue: {
      title: 'Repair queue',
      columns: {
        date: 'Date',
        job: 'Job',
        part: 'Part',
        sku: 'SKU',
        qty: 'Qty',
        disposition: 'Outcome',
        actions: 'Actions',
      },
      empty: 'Queue is empty',
      actions: {
        ok: 'OK',
        bad: 'BAD',
        return: 'Returned',
      },
    },
    reports: {
      dateRangeTitle: 'Date range',
      fromLabel: 'From',
      toLabel: 'To',
      jobsSummaryTitle: 'Job summary',
      jobsSummary: {
        totalPrefix: 'Total (within range):',
      },
      partsSummaryTitle: 'Parts summary',
      partsSummary: {
        totalPrefix: 'Parts used (qty):',
        keptLabel: 'Kept on hand',
        disposedLabel: 'Disposed',
        disposalEventsLabel: 'Disposal events',
        returnEventsLabel: 'Returns to manufacturer',
        renewEventsLabel: 'Refurbishments (entries)',
      },
      shipmentsTitle: 'Shipping costs (PLN)',
      shipments: {
        shipmentLabel: 'Shipping',
        insuranceLabel: 'Insurance',
        totalLabel: 'Total:',
      },
      modal: {
        noResults: 'No results',
        close: 'Close',
        jobsTitle: 'Jobs — {{label}}',
        partsTitle: 'Parts — {{label}}',
        jobStatusPrefix: 'Status: {{status}}',
        jobTypePrefix: 'Type: {{type}}',
        jobCreatedAt: 'Created: {{date}}',
        jobFallbackTitle: 'Job {{id}}',
        partQty: 'Quantity: {{qty}}',
        partDisposition: 'Outcome: {{label}}',
        partJob: 'Job: {{job}}',
        partDate: 'Date: {{date}}',
        partUnknown: 'Unknown part',
        jobNoStatus: 'No status',
        jobNoDate: 'No date',
      },
    },
    demo: {
      companies: {
        first: 'Company A',
        second: 'Company B',
      },
      jobs: {
        first: {
          orderNumber: 'ZL-2025-001',
          serialNumber: 'SN12345',
          issue: 'Does not power on',
          actions: 'Power diagnostics',
        },
        second: {
          orderNumber: 'ZL-2025-002',
          serialNumber: 'SN55555',
          issue: 'No video output',
          actions: 'Capacitor replacement',
        },
      },
      inventory: {
        capacitor: 'Capacitor 100uF',
        psu: '12V power supply',
      },
    },
  },
}

export function getStoredLanguage(){
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored && translations[stored]) return stored
  } catch {}
  return DEFAULT_LANGUAGE
}

function getTranslationObject(lang){
  return translations[lang] || translations[DEFAULT_LANGUAGE]
}

export function translate(lang, key, replacements = {}){
  const source = getTranslationObject(lang)
  const parts = key.split('.').filter(Boolean)
  let current = source
  for (const part of parts){
    if (current && Object.prototype.hasOwnProperty.call(current, part)){
      current = current[part]
    } else {
      current = null
      break
    }
  }
  if (current == null) return key
  if (typeof current !== 'string') return current
  let result = current
  for (const [token, value] of Object.entries(replacements)){
    result = result.replaceAll(`{{${token}}}`, String(value))
  }
  return result
}

const LanguageContext = createContext({
  lang: DEFAULT_LANGUAGE,
  locale: getTranslationObject(DEFAULT_LANGUAGE).meta.locale,
  currency: getTranslationObject(DEFAULT_LANGUAGE).meta.currency,
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key, replacements) => translate(DEFAULT_LANGUAGE, key, replacements),
  formatCurrency: (value) => String(value ?? ''),
  formatDate: (value) => value ? new Date(value).toLocaleDateString(getTranslationObject(DEFAULT_LANGUAGE).meta.locale) : '',
  formatDateTime: (value) => value ? new Date(value).toLocaleString(getTranslationObject(DEFAULT_LANGUAGE).meta.locale) : '',
})

export function LanguageProvider({ children }){
  const [lang, setLang] = useState(() => getStoredLanguage())

  useEffect(() => {
    if (typeof document !== 'undefined'){
      document.documentElement.lang = lang
    }
    try {
      if (typeof window !== 'undefined'){
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
      }
    } catch {}
  }, [lang])

  const setLanguage = useCallback((next) => {
    setLang(prev => {
      if (!next || !translations[next]) return prev
      return next
    })
  }, [])

  const toggleLanguage = useCallback(() => {
    setLang(prev => (prev === 'pl' ? 'en' : 'pl'))
  }, [])

  const locale = getTranslationObject(lang).meta.locale || 'pl-PL'
  const currency = getTranslationObject(lang).meta.currency || 'PLN'

  const t = useCallback((key, replacements) => translate(lang, key, replacements), [lang])

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency }),
    [locale, currency]
  )

  const formatCurrency = useCallback((value, options = {}) => {
    const number = Number(value || 0)
    const targetLocale = options.locale || locale
    const targetCurrency = options.currency || currency
    if (options.locale || options.currency){
      return new Intl.NumberFormat(targetLocale, { style: 'currency', currency: targetCurrency }).format(number)
    }
    return currencyFormatter.format(number)
  }, [currencyFormatter, locale, currency])

  const formatDate = useCallback((value, options = {}) => {
    if (!value) return ''
    const date = value instanceof Date ? value : new Date(value)
    return date.toLocaleDateString(options.locale || locale, options)
  }, [locale])

  const formatDateTime = useCallback((value, options = {}) => {
    if (!value) return ''
    const date = value instanceof Date ? value : new Date(value)
    return date.toLocaleString(options.locale || locale, options)
  }, [locale])

  const contextValue = useMemo(() => ({
    lang,
    locale,
    currency,
    setLanguage,
    toggleLanguage,
    t,
    formatCurrency,
    formatDate,
    formatDateTime,
  }), [lang, locale, currency, setLanguage, toggleLanguage, t, formatCurrency, formatDate, formatDateTime])

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(){
  return useContext(LanguageContext)
}

