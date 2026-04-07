import sys
from collections import deque

input = sys.stdin.readline

n, m = map(int, input().split())
items = []
for i in range(n):
    for v in map(int, input().split()):
        items.append((v, i))

items.sort()

eq = [deque() for _ in range(n)]
covered = 0
cur_sum = 0
best_range = float('inf')
best_sum = float('inf')
bl = br = 0
l = 0

for r in range(n * m):
    v, ep = items[r]
    if not eq[ep]:
        covered += 1
        cur_sum += v
    eq[ep].append(v)

    while covered == n:
        rng = items[r][0] - items[l][0]
        if rng < best_range or (rng == best_range and cur_sum < best_sum):
            best_range = rng
            best_sum = cur_sum
            bl, br = l, r

        lv, le = items[l]
        eq[le].popleft()
        if not eq[le]:
            covered -= 1
            cur_sum -= lv
        else:
            cur_sum += eq[le][0] - lv
        l += 1

sel = [0] * n
seen = [False] * n
for i in range(bl, br + 1):
    v, ep = items[i]
    if not seen[ep]:
        seen[ep] = True
        sel[ep] = v

sel.sort()
print(*sel)
