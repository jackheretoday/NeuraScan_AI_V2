import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def get_db():
    """Returns a connection to the SQLite database with dictionary rows."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def query_db(query, args=(), one=False):
    """Executes a query and returns the results as dictionary objects."""
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(query, args)
        rv = cur.fetchall()
        if rv:
            return (dict(rv[0]) if one else [dict(r) for r in rv])
        return None if one else []
    finally:
        conn.close()

def execute_db(query, args=()):
    """Executes a non-query command (INSERT, UPDATE, DELETE) and commits it."""
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(query, args)
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()
