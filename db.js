import firebase from 'firebase-admin'
import config from './config.js'

const db = firebase.initializeApp(config.firebaseConfig)

export default db;