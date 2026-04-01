from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mock_db import db_con

app = FastAPI(title="CloudQuery SQL Sandbox API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SubmitRequest(BaseModel):
    challenge_id: int
    query: str

CHALLENGES = [
    {
        "id": 1,
        "title": "Find Idle Expensive Resources",
        "description": "Our cloud cost scanner found some issues. Your task is to wite a SQL query to find all EC2 instances across any region that are currently 'stopped' but are still incurring a cost greater than $50. Return the `instance_id` and `cost_usd`. Table name: `aws_billing_logs`.",
        "difficulty": "Easy",
        "expected_columns": ["instance_id", "cost_usd"],
        "expected_row_count": 2
    },
    {
        "id": 2,
        "title": "Costliest Engineering Service",
        "description": "Find the service name and total cost of the most expensive service owned by 'engineering'. Table name: `aws_billing_logs`. Alias the total cost as `total_cost`.",
        "difficulty": "Medium",
        "expected_columns": ["service", "total_cost"],
        "expected_row_count": 1
    }
]

EXPECTED_RESULTS = {
    1: [{'instance_id': 'i-aabbccddeeff11223', 'cost_usd': 85.00}, {'instance_id': 'i-99887766554433221', 'cost_usd': 65.50}],
    2: [{'service': 'EC2', 'total_cost': 1501.25}] # Wait we need to calculate exact answer for DB, but we can do dynamic validation
}

@app.get("/challenges")
def get_challenges():
    return CHALLENGES

@app.get("/challenges/{challenge_id}")
def get_challenge(challenge_id: int):
    for c in CHALLENGES:
        if c["id"] == challenge_id:
            return c
    raise HTTPException(status_code=404, detail="Challenge not found")

@app.post("/submit")
def submit_query(req: SubmitRequest):
    challenge = next((c for c in CHALLENGES if c["id"] == req.challenge_id), None)
    if not challenge:
         raise HTTPException(status_code=404, detail="Challenge not found")
    
    try:
        # Security: In a real app we'd use a read-only transaction or a new isolated duckdb schema
        # Since this is local duckdb, it's fairly safe
        lower_query = req.query.lower()
        if "drop" in lower_query or "delete" in lower_query or "insert" in lower_query or "update" in lower_query:
            return {"status": "error", "message": "Only SELECT queries are allowed."}

        result = db_con.execute(req.query).fetchdf()
        output_rows = result.to_dict('records')
        columns = list(result.columns)
        
        # Validation Logic (Basic)
        passed = True
        message = "Success! You found the wasted cloud spend."
        
        if len(output_rows) != challenge["expected_row_count"]:
            passed = False
            message = f"Expected {challenge['expected_row_count']} rows, got {len(output_rows)}."
        else:
            for col in challenge["expected_columns"]:
                if col not in columns:
                    passed = False
                    message = f"Missing expected column: {col}"
                    break
        
        return {
            "status": "success" if passed else "failed",
            "message": message,
            "columns": columns,
            "rows": output_rows
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
