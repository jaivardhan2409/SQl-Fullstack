import duckdb
import pandas as pd

def get_db():
    # In-memory DuckDB instance
    con = duckdb.connect(database=':memory:')
    
    # Create mock billing table
    con.execute("""
        CREATE TABLE aws_billing_logs (
            instance_id VARCHAR,
            service VARCHAR,
            region VARCHAR,
            cost_usd DECIMAL,
            status VARCHAR,
            owner VARCHAR
        )
    """)
    
    # Insert mock data
    con.execute("""
        INSERT INTO aws_billing_logs VALUES 
        ('i-1234567890abcdef0', 'EC2', 'us-east-1', 450.50, 'running', 'engineering'),
        ('i-0987654321fedcba0', 'EC2', 'us-west-2', 12.00, 'stopped', 'marketing'),
        ('i-11223344556677889', 'EC2', 'us-east-1', 1050.75, 'running', 'engineering'),
        ('rds-prod-db-1', 'RDS', 'us-east-1', 1500.00, 'running', 'engineering'),
        ('i-aabbccddeeff11223', 'EC2', 'eu-west-1', 85.00, 'stopped', 'engineering'),
        ('i-99887766554433221', 'EC2', 'us-east-1', 65.50, 'stopped', 'marketing')
    """)
    
    return con

# Export a configured in-memory db that lives for the lifetime of the process 
# (for simplicity in this local demo; a real app would use persistent db or fresh sandbox per request)
db_con = get_db()
