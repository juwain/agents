n, q = map(int, input().split())
a = list(map(int, input().split()))

diff = [0] * (n + 2)
for _ in range(q):
    l, r = map(int, input().split())
    diff[l] += 1
    diff[r + 1] -= 1

# накапливаем сумму — получаем частоты полок
count = []
cur = 0
for i in range(1, n + 1):
    cur += diff[i]
    count.append(cur)

# сортируем по убыванию и перемножаем
a.sort(reverse=True)
count.sort(reverse=True)

print(sum(a[i] * count[i] for i in range(n)))
