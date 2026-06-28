import sqlite3
import os
import json
import random
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def init_db():
    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
        except Exception as e:
            print(f"Warning: could not delete existing db file: {e}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")

    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT,
        role TEXT,
        avatar TEXT,
        hospital TEXT,
        specialization TEXT,
        licenseNumber TEXT,
        createdAt TEXT,
        lastActive TEXT,
        password TEXT
    )
    """)

    # Create patients table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        patientId TEXT UNIQUE,
        name TEXT,
        age INTEGER,
        gender TEXT,
        dateOfBirth TEXT,
        status TEXT,
        riskCategory TEXT,
        brainAgeGap REAL,
        lastScanDate TEXT,
        totalScans INTEGER,
        diagnosis TEXT,
        createdAt TEXT
    )
    """)

    # Create mri_scans table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mri_scans (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        date TEXT,
        modality TEXT,
        status TEXT,
        classification TEXT,
        confidence REAL,
        probabilityBreakdown TEXT, -- JSON string
        findings TEXT, -- JSON string
        recommendations TEXT, -- JSON string
        modelVersion TEXT,
        preProcessingSteps TEXT, -- JSON string
        createdAt TEXT,
        FOREIGN KEY(patientId) REFERENCES patients(id) ON DELETE CASCADE
    )
    """)

    # Create risk_assessments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS risk_assessments (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        date TEXT,
        conversionProbability REAL,
        riskCategory TEXT,
        confidence REAL,
        mmse INTEGER,
        cdr REAL,
        apoe4 TEXT,
        hippocampalVolume REAL,
        entorhinalVolume REAL,
        ventricularVolume REAL,
        educationYears INTEGER,
        familyHistory INTEGER, -- 0 or 1
        featureImportance TEXT, -- JSON string
        recommendation TEXT,
        modelVersion TEXT,
        FOREIGN KEY(patientId) REFERENCES patients(id) ON DELETE CASCADE
    )
    """)

    # Create longitudinal_data table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS longitudinal_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId TEXT,
        date TEXT,
        mmse INTEGER,
        cdr REAL,
        brainAgeGap REAL,
        hippocampalVolume REAL,
        diseaseStage TEXT,
        riskScore REAL,
        FOREIGN KEY(patientId) REFERENCES patients(id) ON DELETE CASCADE
    )
    """)

    # Create audit_logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        userId TEXT,
        userName TEXT,
        userRole TEXT,
        timestamp TEXT,
        action TEXT,
        details TEXT,
        patientId TEXT,
        modelVersion TEXT,
        riskCategory TEXT,
        ipAddress TEXT,
        abhaId TEXT,
        modelHash TEXT,
        confidence REAL,
        uncertaintyStatus INTEGER -- 0 or 1
    )
    """)

    conn.commit()
    return conn

# Helper Functions
def random_int(vmin, vmax):
    return random.randint(vmin, vmax)

def random_float(vmin, vmax, decimals=1):
    return round(random.uniform(vmin, vmax), decimals)

def random_date(start_str, end_str):
    start = datetime.strptime(start_str, "%Y-%m-%d")
    end = datetime.strptime(end_str, "%Y-%m-%d")
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = random.randrange(int_delta)
    res_date = start + timedelta(seconds=random_second)
    return res_date.strftime("%Y-%m-%d")

def pick(arr):
    return random.choice(arr)

def populate_data(conn):
    cursor = conn.cursor()

    # 1. Seed Users
    users_data = [
        ('U-001', 'dr.sharma@neuroscan.ai', 'Dr. Aarav Sharma', 'doctor', '', 'All India Institute of Medical Sciences', 'Neurology', 'MCI-2021-45892', '2023-01-15', '2026-06-10', 'password123'),
        ('U-002', 'research.patel@neuroscan.ai', 'Dr. Priya Patel', 'researcher', '', 'NIMHANS', 'Cognitive Neuroscience', None, '2023-03-20', '2026-06-09', 'password123'),
        ('U-003', 'admin@neuroscan.ai', 'Rahul Verma', 'administrator', '', 'NeuroScan AI', None, None, '2023-01-01', '2026-06-10', 'password123'),
        ('U-004', 'dr.malhotra@neuroscan.ai', 'Dr. Vikram Malhotra', 'doctor', '', 'Fortis Memorial Research Institute', 'Neuroradiology', 'LIC-99881', '2023-05-12', '2026-06-10', 'password123'),
        ('U-005', 'dr.rao@neuroscan.ai', 'Dr. Sunita Rao', 'doctor', '', 'NIMHANS', 'Neurogeriatrics', 'LIC-44220', '2023-07-18', '2026-06-09', 'password123'),
        ('U-006', 'dr.deshmukh@neuroscan.ai', 'Dr. Rajesh Deshmukh', 'doctor', '', 'Apollo Hospitals', 'Clinical Neurology', 'LIC-77113', '2023-09-05', '2026-06-10', 'password123'),
        ('U-007', 'research.sen@neuroscan.ai', 'Dr. Shalini Sen', 'researcher', '', 'AIIMS Delhi', 'Neuro-imaging Studies', None, '2024-02-14', '2026-06-08', 'password123'),
        ('U-008', 'admin.saxena@neuroscan.ai', 'Amit Saxena', 'administrator', '', 'All India Institute of Medical Sciences', None, None, '2023-11-22', '2026-06-10', 'password123'),
        ('U-009', 'admin.joshi@neuroscan.ai', 'Neha Joshi', 'administrator', '', 'Apollo Hospitals', 'IT Compliance', None, '2024-01-10', '2026-06-10', 'password123')
    ]
    cursor.executemany("INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?,?,?)", users_data)

    # Variables for generation
    disease_classes = ['Non Demented', 'Very Mild Demented', 'Mild Demented', 'Moderate Demented']
    risk_categories = ['Low', 'Very Mild', 'Mild', 'Moderate']
    genders = ['Male', 'Female']
    apoe4_statuses = ['Negative', 'Heterozygous', 'Homozygous']
    first_names = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Ananya', 'Priya', 'Riya', 'Aisha', 'Neha', 'Diya', 'Kavya', 'Sara', 'Maya', 'Isha']
    last_names = ['Sharma', 'Patel', 'Singh', 'Verma', 'Gupta', 'Kumar', 'Reddy', 'Joshi', 'Mehta', 'Nair', 'Rao', 'Das', 'Bose', 'Sen', 'Chopra']

    # 2. ADNI Subjects
    adni_subjects = [
        {
            'id': 'ADNI-101-C',
            'name': 'Arthur Pendelton',
            'age': 74,
            'gender': 'Male',
            'dob': '1952-03-12',
            'status': 'active',
            'risk': 'Moderate',
            'bagap': 8.4,
            'last_scan': '2026-05-15',
            'total_scans': 4,
            'diag': 'Mild Demented',
            'scans': [
                {
                    'id': 'MRI-ADNI-101-C-1',
                    'date': '2024-05-10',
                    'classification': 'Very Mild Demented',
                    'confidence': 0.82,
                    'prob': {'Non Demented': 0.15, 'Very Mild Demented': 0.82, 'Mild Demented': 0.02, 'Moderate Demented': 0.01},
                    'findings': ['Slight ventricular enlargement', 'Normal cortical thickness'],
                    'recs': ['Follow-up scan in 6 months', 'Clinical cognitive assessment']
                },
                {
                    'id': 'MRI-ADNI-101-C-4',
                    'date': '2026-05-15',
                    'classification': 'Mild Demented',
                    'confidence': 0.91,
                    'prob': {'Non Demented': 0.01, 'Very Mild Demented': 0.08, 'Mild Demented': 0.91, 'Moderate Demented': 0.00},
                    'findings': ['Significant bilateral hippocampal atrophy', 'Marked cortical thinning'],
                    'recs': ['Urgent neurological consultation', 'Initiate cognitive therapy']
                }
            ],
            'assessments': [
                {
                    'id': 'RA-ADNI-101-C-1',
                    'date': '2024-05-10',
                    'prob': 0.35,
                    'risk': 'Very Mild',
                    'conf': 0.88,
                    'mmse': 28,
                    'cdr': 0.5,
                    'apoe4': 'Heterozygous',
                    'hipp': 3.6,
                    'ent': 1.5,
                    'vent': 25.4,
                    'edu': 16,
                    'fam': 1,
                    'imp': [
                        {'feature': 'Hippocampal Volume', 'importance': 0.28, 'contribution': 10.2, 'direction': 'negative', 'explanation': 'Reduced volume increases risk.'},
                        {'feature': 'MMSE Score', 'importance': 0.22, 'contribution': 8.4, 'direction': 'negative', 'explanation': 'Early cognitive decline.'}
                    ],
                    'rec': 'Monitor regularly'
                },
                {
                    'id': 'RA-ADNI-101-C-4',
                    'date': '2026-05-15',
                    'prob': 0.88,
                    'risk': 'Moderate',
                    'conf': 0.94,
                    'mmse': 20,
                    'cdr': 1.0,
                    'apoe4': 'Heterozygous',
                    'hipp': 2.4,
                    'ent': 0.9,
                    'vent': 42.1,
                    'edu': 16,
                    'fam': 1,
                    'imp': [
                        {'feature': 'Hippocampal Volume', 'importance': 0.35, 'contribution': 22.4, 'direction': 'negative', 'explanation': 'Severe hippocampal loss.'},
                        {'feature': 'MMSE Score', 'importance': 0.26, 'contribution': 18.1, 'direction': 'negative', 'explanation': 'Cognitive decline below threshold.'}
                    ],
                    'rec': 'Pharmacological intervention recommended'
                }
            ],
            'longitudinal': [
                {'date': '2024-05-10', 'mmse': 28, 'cdr': 0.5, 'bagap': 4.2, 'hipp': 3.6, 'stage': 'Very Mild Demented', 'risk': 0.35},
                {'date': '2024-11-12', 'mmse': 26, 'cdr': 0.5, 'bagap': 5.8, 'hipp': 3.2, 'stage': 'Very Mild Demented', 'risk': 0.52},
                {'date': '2025-05-14', 'mmse': 23, 'cdr': 1.0, 'bagap': 7.2, 'hipp': 2.8, 'stage': 'Mild Demented', 'risk': 0.74},
                {'date': '2026-05-15', 'mmse': 20, 'cdr': 1.0, 'bagap': 8.4, 'hipp': 2.4, 'stage': 'Mild Demented', 'risk': 0.88}
            ]
        },
        {
            'id': 'ADNI-102-C',
            'name': 'Eleanor Vance',
            'age': 69,
            'gender': 'Female',
            'dob': '1957-08-22',
            'status': 'active',
            'risk': 'Moderate',
            'bagap': 9.2,
            'last_scan': '2026-06-01',
            'total_scans': 4,
            'diag': 'Mild Demented',
            'scans': [
                {
                    'id': 'MRI-ADNI-102-C-1',
                    'date': '2024-06-05',
                    'classification': 'Very Mild Demented',
                    'confidence': 0.85,
                    'prob': {'Non Demented': 0.10, 'Very Mild Demented': 0.85, 'Mild Demented': 0.03, 'Moderate Demented': 0.02},
                    'findings': ['Early hippocampal loss', 'Ventricles within normal range'],
                    'recs': ['Follow-up in 6 months', 'Clinical evaluation']
                },
                {
                    'id': 'MRI-ADNI-102-C-4',
                    'date': '2026-06-01',
                    'classification': 'Mild Demented',
                    'confidence': 0.93,
                    'prob': {'Non Demented': 0.01, 'Very Mild Demented': 0.06, 'Mild Demented': 0.93, 'Moderate Demented': 0.00},
                    'findings': ['Severe cortical atrophy in temporal and parietal regions', 'Enlarged ventricles'],
                    'recs': ['Clinical intervention recommended', 'Refer to neurology clinic']
                }
            ],
            'assessments': [
                {
                    'id': 'RA-ADNI-102-C-1',
                    'date': '2024-06-05',
                    'prob': 0.42,
                    'risk': 'Very Mild',
                    'conf': 0.87,
                    'mmse': 27,
                    'cdr': 0.5,
                    'apoe4': 'Homozygous',
                    'hipp': 3.4,
                    'ent': 1.3,
                    'vent': 22.8,
                    'edu': 14,
                    'fam': 0,
                    'imp': [
                        {'feature': 'Hippocampal Volume', 'importance': 0.28, 'contribution': 11.4, 'direction': 'negative', 'explanation': 'Mild hippocampal loss.'}
                    ],
                    'rec': 'Monitor cognitive trends closely'
                },
                {
                    'id': 'RA-ADNI-102-C-4',
                    'date': '2026-06-01',
                    'prob': 0.91,
                    'risk': 'Moderate',
                    'conf': 0.95,
                    'mmse': 18,
                    'cdr': 1.0,
                    'apoe4': 'Homozygous',
                    'hipp': 2.1,
                    'ent': 0.7,
                    'vent': 39.5,
                    'edu': 14,
                    'fam': 0,
                    'imp': [
                        {'feature': 'Hippocampal Volume', 'importance': 0.32, 'contribution': 24.5, 'direction': 'negative', 'explanation': 'Accelerated volume reduction.'},
                        {'feature': 'APOE4 Status', 'importance': 0.18, 'contribution': 12.0, 'direction': 'positive', 'explanation': 'Homozygous carrier status.'}
                    ],
                    'rec': 'Immediate clinical review suggested'
                }
            ],
            'longitudinal': [
                {'date': '2024-06-05', 'mmse': 27, 'cdr': 0.5, 'bagap': 3.8, 'hipp': 3.4, 'stage': 'Very Mild Demented', 'risk': 0.42},
                {'date': '2024-12-08', 'mmse': 25, 'cdr': 0.5, 'bagap': 5.4, 'hipp': 3.0, 'stage': 'Very Mild Demented', 'risk': 0.58},
                {'date': '2025-06-04', 'mmse': 22, 'cdr': 1.0, 'bagap': 7.5, 'hipp': 2.6, 'stage': 'Mild Demented', 'risk': 0.79},
                {'date': '2026-06-01', 'mmse': 18, 'cdr': 1.0, 'bagap': 9.2, 'hipp': 2.1, 'stage': 'Mild Demented', 'risk': 0.91}
            ]
        },
        {
            'id': 'ADNI-201-S',
            'name': 'Robert Chen',
            'age': 76,
            'gender': 'Male',
            'dob': '1950-01-15',
            'status': 'active',
            'risk': 'Very Mild',
            'bagap': 4.1,
            'last_scan': '2026-04-20',
            'total_scans': 4,
            'diag': 'Very Mild Demented',
            'scans': [
                {
                    'id': 'MRI-ADNI-201-S-1',
                    'date': '2024-04-18',
                    'classification': 'Very Mild Demented',
                    'confidence': 0.79,
                    'prob': {'Non Demented': 0.18, 'Very Mild Demented': 0.79, 'Mild Demented': 0.02, 'Moderate Demented': 0.01},
                    'findings': ['Stable baseline volumes', 'Minor ventricular prominent spaces'],
                    'recs': ['Routine annual scan', 'Maintain cognitive activity']
                },
                {
                    'id': 'MRI-ADNI-201-S-4',
                    'date': '2026-04-20',
                    'classification': 'Very Mild Demented',
                    'confidence': 0.81,
                    'prob': {'Non Demented': 0.16, 'Very Mild Demented': 0.81, 'Mild Demented': 0.02, 'Moderate Demented': 0.01},
                    'findings': ['No significant changes from previous baseline MRI', 'Hippocampal volume remains stable'],
                    'recs': ['Continue monitoring on standard schedule']
                }
            ],
            'assessments': [
                {
                    'id': 'RA-ADNI-201-S-1',
                    'date': '2024-04-18',
                    'prob': 0.32,
                    'risk': 'Very Mild',
                    'conf': 0.89,
                    'mmse': 26,
                    'cdr': 0.5,
                    'apoe4': 'Negative',
                    'hipp': 3.1,
                    'ent': 1.4,
                    'vent': 31.2,
                    'edu': 18,
                    'fam': 0,
                    'imp': [
                        {'feature': 'Hippocampal Volume', 'importance': 0.25, 'contribution': 5.1, 'direction': 'negative', 'explanation': 'Stable volume.'}
                    ],
                    'rec': 'Annual screening recommended'
                },
                {
                    'id': 'RA-ADNI-201-S-4',
                    'date': '2026-04-20',
                    'prob': 0.31,
                    'risk': 'Very Mild',
                    'conf': 0.90,
                    'mmse': 26,
                    'cdr': 0.5,
                    'apoe4': 'Negative',
                    'hipp': 3.1,
                    'ent': 1.4,
                    'vent': 31.5,
                    'edu': 18,
                    'fam': 0,
                    'imp': [
                        {'feature': 'Hippocampal Volume', 'importance': 0.25, 'contribution': 5.0, 'direction': 'negative', 'explanation': 'Stable volume.'}
                    ],
                    'rec': 'Stable parameters. Continue monitoring.'
                }
            ],
            'longitudinal': [
                {'date': '2024-04-18', 'mmse': 26, 'cdr': 0.5, 'bagap': 4.0, 'hipp': 3.1, 'stage': 'Very Mild Demented', 'risk': 0.32},
                {'date': '2024-10-20', 'mmse': 27, 'cdr': 0.5, 'bagap': 3.9, 'hipp': 3.1, 'stage': 'Very Mild Demented', 'risk': 0.30},
                {'date': '2025-04-22', 'mmse': 26, 'cdr': 0.5, 'bagap': 4.2, 'hipp': 3.0, 'stage': 'Very Mild Demented', 'risk': 0.33},
                {'date': '2026-04-20', 'mmse': 26, 'cdr': 0.5, 'bagap': 4.1, 'hipp': 3.1, 'stage': 'Very Mild Demented', 'risk': 0.31}
            ]
        },
        {
            'id': 'ADNI-202-S',
            'name': 'Margaret Thompson',
            'age': 71,
            'gender': 'Female',
            'dob': '1955-11-05',
            'status': 'active',
            'risk': 'Very Mild',
            'bagap': 2.5,
            'last_scan': '2026-05-01',
            'total_scans': 4,
            'diag': 'Very Mild Demented',
            'scans': [
                {
                    'id': 'MRI-ADNI-202-S-1',
                    'date': '2024-05-02',
                    'classification': 'Very Mild Demented',
                    'confidence': 0.83,
                    'prob': {'Non Demented': 0.14, 'Very Mild Demented': 0.83, 'Mild Demented': 0.02, 'Moderate Demented': 0.01},
                    'findings': ['Stable baseline brain volume', 'Mild temporal lobe asymmetry'],
                    'recs': ['Standard screening follow-up']
                },
                {
                    'id': 'MRI-ADNI-202-S-4',
                    'date': '2026-05-01',
                    'classification': 'Very Mild Demented',
                    'confidence': 0.84,
                    'prob': {'Non Demented': 0.13, 'Very Mild Demented': 0.84, 'Mild Demented': 0.02, 'Moderate Demented': 0.01},
                    'findings': ['Stable temporal structure, no significant progression'],
                    'recs': ['Annual clinical reassessment']
                }
            ],
            'assessments': [
                {
                    'id': 'RA-ADNI-202-S-1',
                    'date': '2024-05-02',
                    'prob': 0.34,
                    'risk': 'Very Mild',
                    'conf': 0.91,
                    'mmse': 25,
                    'cdr': 0.5,
                    'apoe4': 'Negative',
                    'hipp': 3.3,
                    'ent': 1.4,
                    'vent': 29.8,
                    'edu': 12,
                    'fam': 1,
                    'imp': [
                        {'feature': 'Hippocampal Volume', 'importance': 0.24, 'contribution': 4.8, 'direction': 'negative', 'explanation': 'Stable volume.'}
                    ],
                    'rec': 'Annual review suggested'
                },
                {
                    'id': 'RA-ADNI-202-S-4',
                    'date': '2026-05-01',
                    'prob': 0.33,
                    'risk': 'Very Mild',
                    'conf': 0.92,
                    'mmse': 25,
                    'cdr': 0.5,
                    'apoe4': 'Negative',
                    'hipp': 3.3,
                    'ent': 1.4,
                    'vent': 30.1,
                    'edu': 12,
                    'fam': 1,
                    'imp': [
                        {'feature': 'Hippocampal Volume', 'importance': 0.24, 'contribution': 4.7, 'direction': 'negative', 'explanation': 'Stable volume.'}
                    ],
                    'rec': 'Parameters are stable. Maintain monitoring.'
                }
            ],
            'longitudinal': [
                {'date': '2024-05-02', 'mmse': 25, 'cdr': 0.5, 'bagap': 2.6, 'hipp': 3.3, 'stage': 'Very Mild Demented', 'risk': 0.34},
                {'date': '2024-11-05', 'mmse': 25, 'cdr': 0.5, 'bagap': 2.5, 'hipp': 3.3, 'stage': 'Very Mild Demented', 'risk': 0.35},
                {'date': '2025-05-01', 'mmse': 26, 'cdr': 0.5, 'bagap': 2.4, 'hipp': 3.4, 'stage': 'Very Mild Demented', 'risk': 0.32},
                {'date': '2026-05-01', 'mmse': 25, 'cdr': 0.5, 'bagap': 2.5, 'hipp': 3.3, 'stage': 'Very Mild Demented', 'risk': 0.33}
            ]
        }
    ]

    # Preprocessing steps default template
    def get_preprocessing_steps():
        return [
            {'name': 'Skull Stripping', 'status': 'completed', 'duration': '1.2s'},
            {'name': 'Bias Field Correction', 'status': 'completed', 'duration': '0.8s'},
            {'name': 'Spatial Normalization', 'status': 'completed', 'duration': '2.1s'},
            {'name': 'Segmentation', 'status': 'completed', 'duration': '3.5s'}
        ]

    for subj in adni_subjects:
        p_id = subj['id']
        created_at = '2023-01-01' if '101' in p_id or '201' in p_id else '2023-06-01'
        
        # Save Patient
        cursor.execute("""
        INSERT INTO patients (id, patientId, name, age, gender, dateOfBirth, status, riskCategory, brainAgeGap, lastScanDate, totalScans, diagnosis, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (p_id, p_id, subj['name'], subj['age'], subj['gender'], subj['dob'], subj['status'], subj['risk'], subj['bagap'], subj['last_scan'], subj['total_scans'], subj['diag'], created_at))

        # Save Scans
        for scan in subj['scans']:
            pre_proc = get_preprocessing_steps()
            cursor.execute("""
            INSERT INTO mri_scans (id, patientId, date, modality, status, classification, confidence, probabilityBreakdown, findings, recommendations, modelVersion, preProcessingSteps, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (scan['id'], p_id, scan['date'], 'T1', 'completed', scan['classification'], scan['confidence'], json.dumps(scan['prob']), json.dumps(scan['findings']), json.dumps(scan['recs']), 'NeuroScan-v2.4.1', json.dumps(pre_proc), scan['date']))

        # Save Assessments
        for ass in subj['assessments']:
            cursor.execute("""
            INSERT INTO risk_assessments (id, patientId, date, conversionProbability, riskCategory, confidence, mmse, cdr, apoe4, hippocampalVolume, entorhinalVolume, ventricularVolume, educationYears, familyHistory, featureImportance, recommendation, modelVersion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (ass['id'], p_id, ass['date'], ass['prob'], ass['risk'], ass['conf'], ass['mmse'], ass['cdr'], ass['apoe4'], ass['hipp'], ass['ent'], ass['vent'], ass['edu'], ass['fam'], json.dumps(ass['imp']), ass['rec'], 'NeuroScan-v2.4.1'))

        # Save Longitudinal
        for lpt in subj['longitudinal']:
            cursor.execute("""
            INSERT INTO longitudinal_data (patientId, date, mmse, cdr, brainAgeGap, hippocampalVolume, diseaseStage, riskScore)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (p_id, lpt['date'], lpt['mmse'], lpt['cdr'], lpt['bagap'], lpt['hipp'], lpt['stage'], lpt['risk']))

    # 3. Generate 96 Synthetic Patients
    for i in range(1, 97):
        p_num = f"{i:04d}"
        p_id = f"P-{p_num}"
        age = random_int(55, 90)
        gender = pick(genders)
        riskCategory = pick(risk_categories)
        diagnosis = pick(disease_classes)
        brainAgeGap = random_float(-8.0, 15.0, 1)
        scanCount = random_int(1, 12)
        status = 'critical' if riskCategory == 'Moderate' else 'active' if random.random() > 0.2 else 'inactive'
        
        dob_year = datetime.now().year - age
        dob = f"{dob_year}-{random_int(1, 12):02d}-{random_int(1, 28):02d}"
        
        scans_info = []
        for si in range(1, scanCount + 1):
            scan_date = random_date('2023-01-01', '2026-06-01')
            scans_info.append(scan_date)
        scans_info.sort()
        
        created_at = scans_info[0] if scans_info else '2023-01-01'
        last_scan = scans_info[-1] if scans_info else '2026-01-01'
        p_name = f"{pick(first_names)} {pick(last_names)}"

        # Insert Patient
        cursor.execute("""
        INSERT INTO patients (id, patientId, name, age, gender, dateOfBirth, status, riskCategory, brainAgeGap, lastScanDate, totalScans, diagnosis, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (p_id, p_id, p_name, age, gender, dob, status, riskCategory, brainAgeGap, last_scan, scanCount, diagnosis, created_at))

        # Scans
        for si, sdate in enumerate(scans_info):
            scan_id = f"MRI-{i}-{si+1}"
            confidence = random_float(0.78, 0.99, 2)
            prob_breakdown = {
                'Non Demented': random_float(0.01, 0.7, 2),
                'Very Mild Demented': random_float(0.01, 0.7, 2),
                'Mild Demented': random_float(0.01, 0.7, 2),
                'Moderate Demented': random_float(0.01, 0.7, 2),
            }
            # Normalize probabilities to sum to 1
            total_prob = sum(prob_breakdown.values())
            for k in prob_breakdown:
                prob_breakdown[k] = round(prob_breakdown[k] / total_prob, 2)
            
            findings = [
                'Mild hippocampal atrophy observed' if random.random() > 0.4 else 'Temporal cortex thinning',
                'Ventricular enlargement noted' if random.random() > 0.5 else 'Perivascular spaces observed',
                'Cortical thinning in temporal regions' if random.random() > 0.3 else 'No active hemorrhages'
            ]
            recs = [
                'Follow-up MRI recommended in 6 months' if random.random() > 0.5 else 'Neurological consult suggested',
                'Neurological consultation advised' if random.random() > 0.4 else 'Regular screening continues',
                'Consider cognitive assessment' if random.random() > 0.3 else 'Maintain active physical regimen'
            ]
            pre_proc = get_preprocessing_steps()
            
            cursor.execute("""
            INSERT INTO mri_scans (id, patientId, date, modality, status, classification, confidence, probabilityBreakdown, findings, recommendations, modelVersion, preProcessingSteps, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (scan_id, p_id, sdate, 'T1', 'completed', diagnosis, confidence, json.dumps(prob_breakdown), json.dumps(findings), json.dumps(recs), 'NeuroScan-v2.4.1', json.dumps(pre_proc), sdate))

        # Assessments
        assessmentCount = min(scanCount, random_int(1, 5))
        ass_dates = []
        for ai in range(assessmentCount):
            ass_dates.append(random_date('2023-06-01', '2026-06-01'))
        ass_dates.sort()
        
        for ai, adate in enumerate(ass_dates):
            ass_id = f"RA-{i}-{ai+1}"
            prob = random_float(0.05, 0.95, 2)
            conf = random_float(0.75, 0.98, 2)
            mmse = random_int(18, 30)
            cdr = random_float(0.0, 3.0, 1)
            apoe4 = pick(apoe4_statuses)
            hipp = random_float(2.0, 4.5, 2)
            ent = random_float(0.8, 2.0, 2)
            vent = random_float(15.0, 50.0, 1)
            edu = random_int(8, 20)
            fam = 1 if random.random() > 0.7 else 0
            
            features_imp = [
                {'feature': 'Hippocampal Volume', 'importance': random_float(0.15, 0.35, 2), 'contribution': random_float(10.0, 25.0, 1), 'direction': 'negative', 'explanation': 'Hippocampal volume reduction contributes to conversion risk.'},
                {'feature': 'MMSE Score', 'importance': random_float(0.1, 0.25, 2), 'contribution': random_float(8.0, 20.0, 1), 'direction': 'negative', 'explanation': 'Lower MMSE scores indicate cognitive decline.'},
                {'feature': 'CDR', 'importance': random_float(0.1, 0.2, 2), 'contribution': random_float(5.0, 15.0, 1), 'direction': 'positive', 'explanation': 'Higher CDR score correlates with disease severity.'},
                {'feature': 'Brain Age Gap', 'importance': random_float(0.08, 0.18, 2), 'contribution': random_float(5.0, 12.0, 1), 'direction': 'positive', 'explanation': 'Accelerated brain aging is a risk factor.'},
                {'feature': 'APOE4 Status', 'importance': random_float(0.05, 0.15, 2), 'contribution': random_float(3.0, 10.0, 1), 'direction': 'positive', 'explanation': 'APOE4 carrier status increases genetic risk.'}
            ]
            rec = pick([
                'Continue monitoring with quarterly assessments.',
                'Consider initiating cholinesterase inhibitor therapy.',
                'Refer to neurology specialist for comprehensive evaluation.',
                'Lifestyle interventions recommended including cognitive training.',
                'Schedule follow-up MRI in 3 months.',
                'Patient shows stable cognition; continue annual monitoring.',
            ])
            
            cursor.execute("""
            INSERT INTO risk_assessments (id, patientId, date, conversionProbability, riskCategory, confidence, mmse, cdr, apoe4, hippocampalVolume, entorhinalVolume, ventricularVolume, educationYears, familyHistory, featureImportance, recommendation, modelVersion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (ass_id, p_id, adate, prob, riskCategory, conf, mmse, cdr, apoe4, hipp, ent, vent, edu, fam, json.dumps(features_imp), rec, 'NeuroScan-v2.4.1'))

        # Longitudinal
        long_count = min(scanCount, 8)
        long_dates = []
        for li in range(long_count):
            long_dates.append(random_date('2023-01-01', '2026-06-01'))
        long_dates.sort()
        
        for ldate in long_dates:
            lmmse = random_int(18, 30)
            lcdr = random_float(0.0, 3.0, 1)
            lbag = random_float(-5.0, 12.0, 1)
            lhipp = random_float(2.0, 4.5, 2)
            lrisk = random_float(0.1, 0.95, 2)
            
            cursor.execute("""
            INSERT INTO longitudinal_data (patientId, date, mmse, cdr, brainAgeGap, hippocampalVolume, diseaseStage, riskScore)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (p_id, ldate, lmmse, lcdr, lbag, lhipp, diagnosis, lrisk))

    # 4. Seed Audit Logs (200 records)
    abha_map = {
        'ADNI-101-C': '91-0428-1952-4731',
        'ADNI-102-C': '32-5819-1957-2284',
        'ADNI-201-S': '78-0115-1950-8819',
        'ADNI-202-S': '45-1105-1955-3012',
    }
    user_ids = ['U-001', 'U-002', 'U-003']
    user_names = ['Dr. Aarav Sharma', 'Dr. Priya Patel', 'Rahul Verma']
    user_roles = ['doctor', 'researcher', 'administrator']

    for i in range(200):
        is_model_action = i % 2 == 0
        pat_id = f"ADNI-{101 + (i % 2)}-{'C' if i % 6 == 0 else 'S'}" if i % 3 == 0 else None
        display_pat_id = pat_id if pat_id else f"P-{i % 96 + 1:04d}"
        abha_id = abha_map.get(display_pat_id) if pat_id else f"91-{1000 + (i % 9000)}-{1000 + (i % 9000)}-{1000 + (i % 9000)}"
        
        confidence = round(0.72 + (i % 28) * 0.01, 2) if is_model_action else None
        model_hash = 'NeuroScan-v2.0-EfficientNetB3' if is_model_action and (i % 4 == 0) else 'NeuroScan-v2.4-Transformer' if is_model_action else None
        uncertainty_status = 1 if (confidence is not None and confidence < 0.85) else 0
        
        u_idx = random_int(0, 2)
        u_id = user_ids[u_idx]
        u_name = user_names[u_idx]
        u_role = user_roles[u_idx]
        
        timestamp = random_date('2025-01-01', '2026-06-10') + 'T' + f"{random_int(0,23):02d}:{random_int(0,59):02d}:{random_int(0,59):02d}Z"
        action = pick(['analysis', 'prediction', 'report_generated', 'report_downloaded', 'patient_viewed', 'settings_changed', 'login', 'logout'])
        details = pick([
            'MRI analysis completed for patient',
            'Risk prediction generated for patient',
            'Clinical report generated',
            'Report downloaded in PDF format',
            'Patient profile viewed',
            'Model threshold settings updated',
            'User logged in',
            'User logged out',
        ])
        
        cursor.execute("""
        INSERT INTO audit_logs (id, userId, userName, userRole, timestamp, action, details, patientId, modelVersion, riskCategory, ipAddress, abhaId, modelHash, confidence, uncertaintyStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"AUD-{i+1:04d}",
            u_id,
            u_name,
            u_role,
            timestamp,
            action,
            details,
            display_pat_id if (action in ['analysis', 'prediction', 'patient_viewed', 'report_generated']) else None,
            'NeuroScan-v2.4.1' if random.random() > 0.5 else None,
            pick(risk_categories) if random.random() > 0.7 else None,
            f"192.168.{random_int(1, 255)}.{random_int(1, 255)}",
            abha_id if random.random() > 0.5 else None,
            model_hash,
            confidence,
            uncertainty_status
        ))

    conn.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    conn = init_db()
    populate_data(conn)
    conn.close()
