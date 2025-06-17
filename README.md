# Project Manager

Ein umfassendes, Open-Source Projektmanagement-Tool mit integriertem Wissensmanagement und Knowledge Graph.

## 🚀 Features

### ✅ Implementiert
- **Benutzerauthentifizierung** - Firebase Auth mit Email/Passwort
- **Projektmanagement** - CRUD Operations für Projekte
- **Responsive Design** - Material-UI basierte Benutzeroberfläche
- **Echtzeit-Updates** - Firestore Real-time Database
- **Team-Management** - Multi-User Projekt-Zugriff
- **Such- und Filterfunktionen** - Projekte durchsuchen und filtern

### 🚧 In Entwicklung
- **Kanban Board** - Task Management mit Drag & Drop
- **Knowledge Graph** - Projektverknüpfungen visualisieren
- **Datei-Management** - Upload und Anhänge-System
- **Chat Integration** - Projektbezogene Kommunikation

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: Redux Toolkit
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Routing**: React Router v6
- **Date Handling**: date-fns

## 📦 Installation

### Voraussetzungen
- Node.js (v16 oder höher)
- npm oder yarn
- Firebase Projekt

### 1. Repository klonen
```bash
git clone <repository-url>
cd project-manager
```

### 2. Dependencies installieren
```bash
npm install
```

### 3. Firebase Setup
1. Erstellen Sie ein Firebase Projekt auf [Firebase Console](https://console.firebase.google.com/)
2. Aktivieren Sie Authentication (Email/Password)
3. Erstellen Sie eine Firestore Database
4. Aktivieren Sie Firebase Storage
5. Kopieren Sie die Firebase Konfiguration

### 4. Environment Variables
```bash
cp .env.example .env.local
```

Fügen Sie Ihre Firebase Konfiguration in `.env.local` ein:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 5. Firebase Rules Setup
```bash
# Firestore Rules
firebase deploy --only firestore:rules

# Storage Rules
firebase deploy --only storage
```

### 6. Anwendung starten
```bash
npm start
```

Die Anwendung läuft auf [http://localhost:3000](http://localhost:3000)

## 🔧 Verfügbare Scripts

- `npm start` - Startet den Development Server
- `npm run build` - Erstellt Production Build
- `npm test` - Führt Tests aus
- `npm run typecheck` - TypeScript Type Checking
- `npm run lint` - ESLint Code Analyse

## 🚀 Deployment

### Firebase Hosting
```bash
# Build erstellen
npm run build

# Firebase CLI installieren
npm install -g firebase-tools

# Firebase Login
firebase login

# Projekt initialisieren
firebase init hosting

# Deploy
firebase deploy
```

### Alternative Deployment-Optionen
- **Vercel**: `vercel --prod`
- **Netlify**: Drag & Drop der `build/` Ordner
- **AWS S3**: Upload der `build/` Inhalte

## 📁 Projektstruktur

```
src/
├── components/          # React Komponenten
│   ├── Auth/           # Authentifizierung
│   ├── Layout/         # Layout Komponenten
│   └── Projects/       # Projekt Komponenten
├── hooks/              # Custom React Hooks
├── pages/              # Seiten-Komponenten
├── services/           # Firebase Services
│   └── firebase/       # Firebase Konfiguration
├── store/              # Redux Store
│   └── slices/         # Redux Slices
├── types/              # TypeScript Definitionen
└── utils/              # Helper Funktionen
```

## 🔒 Security

### Firestore Security Rules
Die Sicherheitsregeln gewährleisten:
- Benutzer können nur ihre eigenen Daten bearbeiten
- Projekt-Zugriff basiert auf Team-Mitgliedschaft
- Validierung aller Eingabedaten

### Best Practices
- Environment Variables für sensitive Daten
- Client-seitige und Server-seitige Validierung
- Principle of Least Privilege

## 🤝 Contributing

1. Fork das Repository
2. Erstellen Sie einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffnen Sie eine Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 🆘 Support

- **Dokumentation**: Siehe `docs/` Ordner
- **Issues**: GitHub Issues für Bug Reports
- **Discussions**: GitHub Discussions für Fragen

## 🗺️ Roadmap

### Phase 1 (Aktuell) - MVP
- [x] Authentifizierung
- [x] Basis Projektmanagement
- [x] UI/UX Grundlagen
- [ ] Kanban Board
- [ ] Basic Team Management

### Phase 2 - Erweiterte Features  
- [ ] Knowledge Graph
- [ ] Datei-Management
- [ ] Erweiterte Suche
- [ ] Notifications

### Phase 3 - Integration
- [ ] Chat System
- [ ] Email Integration
- [ ] API für Drittanbieter
- [ ] Mobile App

## 🌟 Acknowledgments

- Material-UI für das Design System
- Firebase für Backend-Services
- React Community für Tools und Libraries