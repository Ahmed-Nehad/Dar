# Dar Tahfez Manager

![Status](https://img.shields.io/badge/Status-Production_Ready-success)
![React](https://img.shields.io/badge/React-18.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Vite](https://img.shields.io/badge/Vite-5.x-purple)
![Dexie.js](https://img.shields.io/badge/Database-Dexie.js-orange)
![License](https://img.shields.io/badge/License-MIT-green)

A robust, **Offline-First Progressive Web App (PWA)** designed to digitize the administrative and academic workflows of Quran memorization centers. This system replaces manual paper-based tracking with a synchronized, cloud-enabled web application that remains fully functional without an internet connection.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Installation & Setup](#installation--setup)
6. [Data Management & Exporting](#data-management--exporting)

---

## Project Overview

Dar Tahfez Manager is built to solve the specific challenges of low-bandwidth environments. It prioritizes data integrity and availability, ensuring that attendance, grading, and student progress can be recorded instantaneously on local devices and synchronized to a central cloud server when connectivity is available.

The application serves two primary user roles:
* **Administrators/Teachers:** Full access to student data, attendance marking, and report generation via secure authentication.
* **Guest Users:** Restricted local access for testing and evaluation purposes with data isolation.

## Key Features

### Offline-First Engine
* **Zero-Latency Operations:** All reads and writes occur against a local IndexedDB database, ensuring instant UI feedback regardless of network speed.
* **Automatic Synchronization:** A background worker monitors network status and reconciles local changes with **Dexie Cloud** when a connection is restored.
* **Conflict Resolution:** Implements consistent conflict handling strategies to manage concurrent edits from multiple devices.

### Academic Management
* **Attendance Tracking:** Grid-based interface for rapid daily attendance marking, optimized for mobile touch interaction.
* **Progress Monitoring:** Dedicated fields for tracking "Current Hifz" (memorization) and "Past Revision" (Muraja'a) with historical logging.
* **Automated Grading:** Algorithms automatically calculate Quranic and Educational performance scores based on daily inputs.

### Reporting System
* **Native Excel Export:** Generates `.xlsx` files with Right-to-Left (RTL) formatting and schema-based column mapping using `write-excel-file`.
* **Print Optimization:** Custom CSS media queries strip UI elements (navigation, buttons) to generate clean, A4-landscape reports directly from the browser print dialog.

## Architecture

This application utilizes a **Local-First** architecture pattern.

1.  **Client-Side Database:** The application interacts exclusively with the local IndexedDB wrapper (Dexie.js). This ensures the application never blocks on network requests.
2.  **Synchronization Layer:** Dexie Cloud acts as the synchronization middleware, handling authentication, replication, and permissions.
3.  **Schema Design:**
    * **Primary Keys:** Usage of UUIDs (`crypto.randomUUID()`) for all entities instead of auto-incrementing integers. This prevents primary key collisions when multiple devices create data offline.
    * **Soft Deletes:** Implementation of "Tombstone" records to ensure deletions propagate correctly across distributed clients.

## Technology Stack

* **Frontend Framework:** React 18
* **Language:** TypeScript 5.0
* **Build Tool:** Vite
* **State Management:** RxJS (Observables)
* **Database:** Dexie.js (IndexedDB)
* **Styling:** Tailwind CSS, DaisyUI
* **Analytics:** PostHog (Session recording, Error tracking)

## Installation & Setup

### Prerequisites
* Node.js (v18 or higher)
* npm or pnpm package manager

### Steps

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/your-username/dar-tahfez-manager.git](https://github.com/your-username/dar-tahfez-manager.git)
    cd dar-tahfez-manager
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory and add your Dexie Cloud DB URL:
    ```env
    VITE_DB_URL=https://<your-db-id>.dexie.cloud
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## Data Management & Exporting

### Excel Export
The application uses a schema-defined export process to ensure compatibility with Microsoft Excel.
* **Attendance Reports:** Dynamic column generation based on the number of sessions in a selected month.
* **Progress Reports:** Fixed-column layout including calculated scores and teacher notes.

### System Logging
Critical system errors (such as sync failures or quota limits) are logged to a dedicated `system_logs` table within the database. This ensures that error reports are preserved even if the external analytics service is blocked by client-side network filters.