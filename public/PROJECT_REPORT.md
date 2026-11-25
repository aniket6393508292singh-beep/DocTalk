# DockTalk
## Online Doctor Consultation and Health Management Platform

### Project Report

**Submitted by:** [Aniket Singh]                         
**Roll Number:** [2408400130011]

**Submitted by:** [Ayushmaan Yadav]
**Roll Number:** [2408400130023]  

**Course / Semester:** [Mini Project / 5th Semester]  
**Department:** [Information Technology]  
**Institution:** [LokMata Devi AhilayaBai Holkar Rajkiya Engineering College ,Mainpuri]  
**Academic Year:** 2026  

**Downloads:** [Download the complete DockTalk project](DockTalk-Project.zip) | [Open browser download page](project-download.html)

---

## Certificate

This is to certify that the project report entitled **DockTalk: Online Doctor Consultation and Health Management Platform** has been completed by **[Student Name]**, bearing roll number **[Roll Number]**, under the guidance of **[Guide Name]** as part of the academic requirements for **[Course Name]** during the academic year 2026.

**Guide Signature:** ____________________  
**Head of Department:** ____________________  
**Date:** ____________________

---

## Declaration

I declare that this project report is my original academic work. The DockTalk website was developed as a frontend prototype to demonstrate online healthcare navigation, health tools, consultation interfaces, first-aid information, and pharmacy/lab-test workflows. The information and interactions presented by the prototype are not a substitute for professional medical advice.

**Student Signature:** ____________________  
**Date:** ____________________

---

## Acknowledgement

I express my sincere gratitude to **[Guide Name]**, the faculty members of **[Department Name]**, and **[Institution Name]** for their guidance and support throughout this project. I also thank my classmates, friends, and family for their feedback during the design, implementation, and testing of the website.

---

## Abstract

DockTalk is a responsive, multi-page healthcare website prototype designed to bring common digital health services into one accessible interface. The platform provides navigation to doctor consultation, specialist discovery, first-aid guidance, health calculators, wellness information, lab-test booking, and pharmacy ordering.

The project is implemented using HTML5, CSS3, and vanilla JavaScript. Client-side interactions include BMI calculation, symptom guidance, chat simulation, appointment forms, lab booking, article rotation, first-aid topic rendering, authentication demonstrations, and a persistent shopping cart. Browser `localStorage` is used to preserve demo account, cart, and order-history data. The system is intentionally designed as a frontend academic prototype; it does not connect to real doctors, payment gateways, medical records, laboratories, pharmacies, or a server database.

**Keywords:** telemedicine, healthcare website, responsive design, health tools, online consultation, JavaScript, localStorage.

---

## 1. Introduction

### 1.1 Background

People often need to locate a suitable specialist, understand basic health information, find first-aid instructions, calculate simple health indicators, or arrange health-related services. These activities are frequently spread across separate websites and applications. A unified interface can improve discoverability and provide a clearer starting point for non-emergency health-related tasks.

DockTalk addresses this idea through a single healthcare portal concept. Its home page groups consultation, specialist, health-tool, lab, pharmacy, first-aid, and health-article features in one place.

### 1.2 Problem Statement

Users may find it difficult to navigate multiple health services through disconnected interfaces. A student-level solution is needed to demonstrate how a healthcare platform could organize these services, provide simple interactive tools, and guide users toward appropriate next steps through a consistent web interface.

### 1.3 Proposed Solution

DockTalk presents a centralized telemedicine management interface containing:

- Doctor and specialist consultation entry points.
- Online chat demonstration with doctor names passed through URL parameters.
- Appointment and lab-test booking forms.
- BMI calculator and symptom checker.
- First-aid instructions for common situations.
- Nutrition and wellness guidance.
- Pharmacy and first-aid product cart functionality.
- Rotating health articles and modal dialogs.
- Demo sign-in and sign-up interaction.

---

## 2. Objectives

The main objectives of DockTalk are:

1. To design a user-friendly healthcare portal using standard web technologies.
2. To organize different healthcare services within a single home page.
3. To provide simple client-side health tools for BMI and symptom guidance.
4. To demonstrate doctor discovery, consultation, chat, and appointment workflows.
5. To provide basic first-aid and wellness information in a readable format.
6. To demonstrate pharmacy and first-aid shopping-cart behavior.
7. To apply responsive layouts for desktop and mobile screen sizes.
8. To practice DOM manipulation, event handling, modal interfaces, and browser storage.

---

## 3. Scope of the Project

### 3.1 Included Scope

The submitted prototype includes a home dashboard, specialist directories for cardiology, pediatrics, therapy, and orthopedics, a doctor chat directory, standalone chat, health tools, first-aid content, pharmacy products, lab-test booking, wellness content, nutrition tips, articles, authentication screens, appointment forms, and cart/order-history interactions.

### 3.2 Excluded Scope

The current version does not provide real-time doctor availability, video/audio communication, real payment processing, prescription validation, delivery tracking, medical-record storage, server-side authentication, clinical diagnosis, or integration with hospital, pharmacy, laboratory, or emergency-service APIs.

---

## 4. Feasibility Study

### 4.1 Technical Feasibility

The project uses technologies available in a modern web browser: HTML5, CSS3, and JavaScript. It can be opened locally without installing a framework or database. This makes the prototype technically suitable for a college demonstration.

### 4.2 Operational Feasibility

The interface is organized around common user tasks and uses forms, buttons, cards, dialogs, and navigation links. Users can browse services without training. The responsive layouts support both desktop and mobile browsing.

### 4.3 Economic Feasibility

The project uses free browser technologies and local assets/URLs. No paid software or hosting service is required for the local prototype. Production deployment would require hosting, a secure backend, and third-party service costs.

---

## 5. System Requirements

### 5.1 Hardware Requirements

- Computer, laptop, tablet, or smartphone.
- Minimum 2 GB RAM recommended for browser execution.
- Keyboard and pointing device for desktop use.
- Internet connection for externally hosted image assets and optional online browsing.

### 5.2 Software Requirements

- Operating system: Windows, macOS, Linux, Android, or iOS.
- Modern browser such as Google Chrome, Microsoft Edge, Firefox, or Safari.
- Text editor or Visual Studio Code for development.
- No external database or server is required for the current prototype.

---

## 6. Technologies Used

| Technology | Use in the project |
|---|---|
| HTML5 | Page structure, forms, navigation, dialogs, semantic sections |
| CSS3 | Responsive layouts, cards, buttons, colors, modals, grids, and visual styling |
| Vanilla JavaScript | Event handling, calculations, DOM updates, modals, validation, and navigation behavior |
| Browser localStorage | Demo user data, current user state, shopping cart, and order history |
| SVG | Inline first-aid illustrations and interface icons |
| External image URLs | Article and first-aid imagery used by the prototype |
| Visual Studio Code | Development and file management environment |

No frontend framework, build tool, backend API, or database is used in the submitted implementation.

---

## 7. System Design

### 7.1 High-Level Architecture

DockTalk follows a client-side multi-page architecture:

```text
User
  |
  v
HTML pages and forms
  |
  +--> CSS presentation layer
  |
  +--> JavaScript interaction layer
          |
          +--> DOM updates and modal dialogs
          +--> Browser localStorage
          +--> URL parameters and page navigation
```

### 7.2 Navigation Structure

```text
MAIN.html
├── Doctor Consultation
│   ├── chat-with-doctor.html
│   └── chat.html
├── Specialists
│   ├── cardio.html
│   ├── Pediatric.html
│   ├── therapy.html
│   └── Orthopedic.html
├── Free Health Tools
│   ├── health-tools.html
│   ├── symptom-checker.html
│   ├── bmi-calculator.html
│   ├── heart-rate.html
│   ├── nutrition.html
│   └── wellness.html
├── First Aid
│   └── first-aid.html
└── Lab Tests and Pharmacy
    ├── lab-tests.html
    └── pharmacy.html
```

### 7.3 Data Flow Examples

**BMI calculation:** User enters weight and height -> units are converted to kilograms/metres -> BMI is calculated -> category and suggestions are displayed -> chart marker is updated.

**Chat flow:** User selects a doctor -> doctor name is passed in the URL -> chat page reads the `doctor` parameter -> messages entered by the user are appended to the chat area.

**Cart flow:** User selects a product -> `addToCart()` stores the item in memory and `localStorage` -> cart count and total are rendered -> checkout creates demo order history and clears the cart.

**Lab booking flow:** User chooses a panel and collection type -> booking modal opens -> name/date/time are collected -> confirmation alert and preparation guide are displayed.

---

## 8. Module Description

### 8.1 Home Dashboard

`MAIN.html` acts as the main entry point. It contains the DockTalk brand, emergency helpline banner, mobile menu, first-aid shortcut, service showcase, daily health updates, article modal, chat modal, global cart panel, booking modal, and authentication integration.

### 8.2 Doctor Consultation and Chat

`chat-with-doctor.html` lists doctors by specialty and provides chat buttons. `chat.html` provides a standalone demo conversation interface. `chat-modal.js` enables selected chat links to open inside an iframe modal from the main site.

### 8.3 Specialist Directories

The specialist pages provide profile cards with doctor names, qualifications, experience, locations, specialties, booking buttons, and chat links. The directories cover cardiology, pediatrics, therapy/psychiatry, and orthopedics.

### 8.4 Appointment Booking

`booking.js` opens an appointment modal when a specialist card's Book button is selected. It collects the patient's name, selected doctor, date, time, and consultation mode, then displays a confirmation message. The current implementation is a demonstration and does not send the request to a server.

### 8.5 Health Tools

The health-tools module links to several tools:

- **BMI Calculator:** Supports kg/lb and cm/m/in units, calculates BMI, classifies the result, updates a visual range chart, and displays general diet and exercise suggestions.
- **Symptom Checker:** Collects age, gender, symptoms, and urgent signs, then displays general urgent or non-urgent guidance.
- **Heart Rate Guide:** Provides information about pulse measurement and healthy ranges.
- **Nutrition Tips:** Displays healthy eating guidance and generates a snack suggestion based on a selected preference.
- **Wellness Articles:** Provides sleep, stress, and movement content with a one-minute breathing exercise.

### 8.6 First-Aid Module

`first-aid.html` contains common first-aid products and step-by-step guidance. Items such as paracetamol, ibuprofen, antiseptic, bandages, ORS, antihistamine, and burn gel can be added to the cart. The main page also provides a quick first-aid modal for cuts, burns, severe bleeding, and choking.

### 8.7 Pharmacy and Lab Tests

The pharmacy page displays medicine and health-product categories. The lab page allows users to select a panel and choose home collection or a lab visit. Both pages demonstrate modal interactions and support service-related actions.

### 8.8 Authentication

`auth.js` implements demo sign-up and sign-in dialogs. User records and the current user are saved in browser storage. The interface changes to show the signed-in user's first name. This module is for demonstration only and must be replaced by secure server-side authentication in a production system.

### 8.9 Articles and Daily Updates

`articles.js` renders rotating health article cards, supports previous/next navigation, automatically rotates content, and opens article details in a modal. Article content is static sample content in the current version.

### 8.10 Shopping Cart and Order History

`cart.js` provides a global cart that can be used by the pharmacy and first-aid pages. It stores products, calculates totals, supports item removal, creates demo order-history entries, and persists data with `localStorage`.

---

## 9. User Interface and Design

The design uses a healthcare-oriented blue palette, clear headings, content cards, responsive grids, modal dialogs, and action buttons. CSS media queries adapt form layouts, grids, navigation, and suggestions for smaller screens. Semantic labels, button text, alternate image text, dialog roles, and keyboard-related handlers are included in several interaction areas to improve usability.

The interface is designed around the following user journey:

1. Open the DockTalk home page.
2. Choose a service category.
3. Review information or enter details in a tool/form.
4. Receive a client-side result, modal confirmation, or demo chat response.
5. Continue to another service through links, back buttons, or the global cart.

---

## 10. Testing Plan and Results

Testing was planned around navigation, forms, calculations, responsive behavior, and browser storage.

| Test case | Expected result | Status to verify during demonstration |
|---|---|---|
| Open `MAIN.html` | Dashboard, service cards, articles, and header load | Pass / Recheck |
| Open mobile menu | Menu opens and closes using the menu button | Pass / Recheck |
| Open health tools | Tool links navigate to their pages | Pass / Recheck |
| Calculate BMI with valid values | BMI, category, suggestions, and chart marker appear | Pass / Recheck |
| Submit symptom checker with urgent sign | Urgent-care guidance is displayed | Pass / Recheck |
| Send a chat message | Message appears in the conversation area | Pass / Recheck |
| Book a specialist appointment | Booking dialog accepts details and shows confirmation | Pass / Recheck |
| Book a lab test | Panel and collection selection are included in the confirmation | Pass / Recheck |
| Add a pharmacy/first-aid item | Cart count, item, and total update | Pass / Recheck |
| Checkout cart | Demo order history is saved and cart is cleared | Pass / Recheck |
| Sign up and sign in | Demo account state is stored and displayed | Pass / Recheck |
| Resize to mobile width | Layout remains usable without horizontal overflow | Pass / Recheck |

**Testing note:** The status column is intentionally left for the student to mark after completing the final live demonstration in the selected browser. The current project is a frontend prototype, so successful behavior is limited to client-side demonstration flows.

---

## 11. Limitations

1. There is no backend server or database.
2. Authentication data is stored in browser `localStorage` and is not secure.
3. Passwords are stored in the browser for demonstration purposes and must not be used in production.
4. Chat, audio calls, video calls, and emergency actions are simulated.
5. Appointment and lab requests are not transmitted to real providers.
6. Pharmacy checkout does not process payments or create real deliveries.
7. Health guidance is simplified and must not be treated as diagnosis or medical advice.
8. Article and profile data is static sample data.
9. Some image content is loaded from external URLs and may require internet access.
10. There is no role-based access control for patients, doctors, administrators, or service providers.

---

## 12. Future Enhancements

Future versions could include:

- Secure backend authentication with password hashing and session management.
- Patient, doctor, laboratory, pharmacy, and administrator dashboards.
- Real-time chat using WebSockets or a managed communication service.
- Secure audio/video consultation using a telemedicine provider.
- Doctor availability, calendar synchronization, and appointment reminders.
- Payment gateway and order-delivery integration.
- Prescription upload and pharmacist verification.
- Encrypted medical records with consent and audit logs.
- Personalized health history and progress tracking.
- Accessibility audits, multilingual support, and offline/PWA support.
- Integration with verified medical content and emergency services.
- Automated testing and deployment through a CI/CD pipeline.

---

## 13. Conclusion

DockTalk demonstrates how a multi-page healthcare portal can be designed and implemented using HTML, CSS, and JavaScript. It brings consultation discovery, specialist profiles, chat, appointment requests, first-aid guidance, health tools, wellness content, lab booking, pharmacy browsing, authentication demonstrations, and cart management into a unified interface.

The project meets its academic objective of demonstrating frontend development, responsive design, DOM manipulation, form handling, browser storage, and modular page organization. Although it is not a production telemedicine system, its modular structure provides a practical foundation for future integration with secure backend services and verified healthcare providers.

---

## 14. References

1. MDN Web Docs, HTML, CSS, JavaScript, DOM, Web Storage, and Form APIs: https://developer.mozilla.org/
2. World Wide Web Consortium, HTML and accessibility standards: https://www.w3.org/
3. General BMI classification concepts based on commonly used public health guidance. The calculator is intended for educational demonstration only.
4. Project source files: `MAIN.html`, `style.css`, `health-tools.css`, `chat.css`, `bmi-calculator.html`, `symptom-checker.html`, `first-aid.html`, `pharmacy.html`, `lab-tests.html`, and related JavaScript modules.

---

## Appendix A: Project File Inventory

| Category | Files |
|---|---|
| Main interface | `MAIN.html`, `style.css` |
| Consultation | `chat-with-doctor.html`, `chat.html`, `chat.css`, `chat-modal.js` |
| Specialist pages | `cardio.html`, `Pediatric.html`, `therapy.html`, `Orthopedic.html` and their CSS files |
| Health tools | `health-tools.html`, `bmi-calculator.html`, `bmi-calculator.css`, `symptom-checker.html`, `symptom-checker.css`, `heart-rate.html`, `nutrition.html`, `wellness.html` |
| First aid and commerce | `first-aid.html`, `pharmacy.html`, `cart.js` |
| Lab services | `lab-tests.html` |
| User and booking demos | `auth.js`, `booking.js` |
| Content | `articles.js`, `assets/` |

## Appendix B: Demonstration Checklist

- Replace all bracketed student, guide, department, and institution fields.
- Open `MAIN.html` in a modern browser.
- Demonstrate one consultation/chat flow.
- Demonstrate BMI calculation and symptom guidance.
- Demonstrate first-aid item addition and cart checkout.
- Demonstrate one specialist appointment and one lab booking.
- Demonstrate sign-up/sign-in behavior.
- Capture screenshots of the home page, health tool, specialist listing, cart, and a modal for the final printed report.
- Mark the test results in Section 10 after the live demonstration.
