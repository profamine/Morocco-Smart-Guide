import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Need to read firebase-applet-config because we aren't running natively inside Express where it's imported
import firebaseConfig from '../firebase-applet-config.json';
import { MONUMENTS } from '../src/data/monuments';

if (!getApps().length) {
  initializeApp({ projectId: firebaseConfig.projectId });
}

const db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId);

async function seed() {
  console.log("Starting seed with admin SDK...");
  const batch = db.batch();
  
  const formattedExisting = MONUMENTS.map(m => ({
      id: String(m.id),
      nom: m.name,
      ville: m.city,
      region: "Maroc",
      latitude: m.latitude,
      longitude: m.longitude,
      categorie: m.category,
      description: m.description,
      histoire: m.history || "Information historique non disponible.",
      horaires: "9h00 - 18h00", // Fictive realistic data
      tarif: "Gratuit",
      accessibilite: "Oui",
      dureeVisite: "1 heure",
      images: [m.image],
      audioGuide: "Non disponible",
      noteMoyenne: 4.5
  }));

  for (const monument of formattedExisting) {
    const docRef = db.collection('monuments').doc(String(monument.id));
    batch.set(docRef, monument);
  }
  
  const metaRef = db.collection('meta').doc('app');
  batch.set(metaRef, { seeded: true, seedVersion: 1 });

  await batch.commit();
  console.log(`Seeded ${formattedExisting.length} monuments successfully.`);
}

seed().catch(console.error);
