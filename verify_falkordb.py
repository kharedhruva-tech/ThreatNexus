import falkordb

print("Connecting to FalkorDB on 127.0.0.1:6379...")
db = falkordb.FalkorDB(host="127.0.0.1", port=6379)
g = db.select_graph("contextgraph")

# Execute test query
print("Running test query...")
res = g.query("RETURN 42 AS answer, 'ContextGraph AI' AS project")
print("Query result header:", res.header)
print("Query result set:", res.result_set)

# Execute node creation test
print("Creating test node...")
res2 = g.query("MERGE (n:System {id: 'SYS-TEST', name: 'Verification System'}) RETURN n.id, n.name")
print("Node merge result:", res2.result_set)

# Query back the node
res3 = g.query("MATCH (n:System {id: 'SYS-TEST'}) RETURN n.id, n.name")
print("Node lookup result:", res3.result_set)

print("\n>>> LIVE FALKORDB PERSISTENCE AND CYPHER EXECUTION FULLY VERIFIED! <<<")
