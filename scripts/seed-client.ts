import { initializeApp } from "firebase/app";
import { getFirestore, doc, writeBatch } from "firebase/firestore";
import fs from "fs";
import { MONUMENTS } from "../src/data/monuments";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Starting seed with client SDK...");
  const batch = writeBatch(db);
  
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
    const docRef = doc(db, 'monuments', String(monument.id));
    batch.set(docRef, monument);
  }
  
  const metaRef = doc(db, 'meta', 'app');
  batch.set(metaRef, { seeded: true, seedVersion: 2 });

  await batch.commit();
  console.log(`Seeded ${formattedExisting.length} monuments successfully.`);
  process.exit(0);
}

seed().catch(e => {
    console.error(e);
    process.exit(1);
});
