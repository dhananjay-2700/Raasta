# RAASTA — Citizen-Service Journey Agent

**Tagline:** One conversation. Every government journey.

RAASTA is a citizen-service journey agent built for MUJHackX 4.0. It takes a vague real-world problem and seamlessly moves the citizen through discovery → eligibility → evidence → documents → form → consent → application → tracking → next action.

Instead of navigating complex government portals or knowing exact scheme names, a citizen can simply say:
> *"My daughter just got admission to college, but we can't afford the fees."*

RAASTA figures out the rest.

---

## 🌟 The Vision (Complete System)

The complete vision for RAASTA involves a complex orchestration pipeline:
1. **User Input:** Voice or Text (Multilingual).
2. **Intent & Extraction (Gemma 4):** Identifies the core problem and extracts entities (age, income, location).
3. **Next Best Action (NBA) Engine:** Determines the exact next step for the citizen.
4. **Resolution Engine:** Maps the problem to the exact government service (e.g., matching the user to a scholarship).
5. **Eligibility Engine:** Checks if the citizen qualifies based on extracted entities.
6. **Evidence Engine:** Digilocker integration to prove eligibility dynamically.
7. **Document Engine:** Recommends missing documents based on demographic gaps.
8. **Smart Form Engine:** Auto-fills 80%+ of the application using previously extracted and verified data.
9. **Consent Engine:** Explicit, clear consent before any submission.
10. **Headless Gov Adapter:** Automatically submits the application to the respective backend system.

---



For the 12-hour hackathon, we have built a **Golden Demo** that perfectly demonstrates this vision in a high-fidelity web prototype.

### Tech Stack
- **Frontend:** Next.js (React), TypeScript, TailwindCSS
- **Backend:** Next.js API Routes (Serverless)
- **AI Simulation:** Local API routes simulating the Gemma 4 intent extraction and gov-adapter submission.

### Features
- **Dynamic Intent Box:** A massive "What happened?" input field that acts as the entry point for the entire journey.
- **Auto-Extraction:** Submitting an intent automatically extracts context (like family member details and financial needs) and routes to the correct application.
- **Data Provenance:** The dynamic smart form visually indicates which fields were automatically extracted by the AI and which require manual input.
- **Next Best Action UI:** A prominent guidance card that directs the user on exactly what to do next.

## 🛠️ How to Run Locally

The entire application runs natively in Next.js. You do not need Python or external databases for the Golden Demo.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Test the Flow:** Type *"My daughter just got admission to college, but we can't afford the fees"* into the intent box and click submit to watch RAASTA go to work!

---

*Built with ❤️ for MUJHackX 4.0*
