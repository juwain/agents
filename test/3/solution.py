import sys

def solve():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    k = int(data[1])

    # Build sorted positions: 0, platforms, n
    pos = [0]
    for i in range(k):
        pos.append(int(data[2 + i]))
    if pos[-1] != n:
        pos.append(n)

    m = len(pos) - 1  # last index

    # Check feasibility: all consecutive gaps must be <= 2
    for i in range(1, m + 1):
        if pos[i] - pos[i - 1] > 2:
            print(-1)
            return

    # DP from end: min jumps from index i to m
    INF = float('inf')
    dp = [INF] * (m + 1)
    dp[m] = 0

    for i in range(m - 1, -1, -1):
        # Try going to i+1
        if pos[i + 1] - pos[i] <= 2 and dp[i + 1] < INF:
            dp[i] = 1 + dp[i + 1]
        # Try going to i+2 (skip one position, jump must be <= 2)
        if i + 2 <= m and pos[i + 2] - pos[i] <= 2 and 1 + dp[i + 2] < dp[i]:
            dp[i] = 1 + dp[i + 2]

    if dp[0] >= INF:
        print(-1)
        return

    # Greedy forward: prefer jump=1 (lex smallest)
    path = []
    i = 0
    while i < m:
        g1 = pos[i + 1] - pos[i]
        # Option 1: jump g1 to i+1
        if g1 == 1 and dp[i + 1] == dp[i] - 1:
            path.append('1')
            i += 1
        # Option 2: jump 2 to i+2 (skip i+1)
        elif i + 2 <= m and pos[i + 2] - pos[i] == 2 and dp[i + 2] == dp[i] - 1:
            path.append('2')
            i += 2
        # Option 3: jump 2 to i+1 (gap is 2)
        else:
            path.append('2')
            i += 1

    print(dp[0])
    sys.stdout.write(''.join(path))
    sys.stdout.write('\n')

solve()
