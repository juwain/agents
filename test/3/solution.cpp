#include <cstdio>
#include <vector>
#include <string>

int main() {
    int n, k;
    scanf("%d %d", &n, &k);

    std::vector<bool> ok(n + 2, false);
    for (int i = 0; i < k; i++) {
        int x;
        scanf("%d", &x);
        ok[x] = true;
    }

    const int INF = n + 2;
    std::vector<int> dist(n + 2, INF);
    dist[0] = 0;

    for (int i = 1; i <= n; i++) {
        if (!ok[i] && i != n) continue;
        int d = INF;
        if (dist[i - 1] < d) d = dist[i - 1];
        if (dist[i - 2] < d) d = dist[i - 2];
        if (d < INF) dist[i] = d + 1;
    }

    if (dist[n] >= INF) {
        printf("-1\n");
        return 0;
    }

    std::string path;
    path.reserve(n);
    int cur = 0;
    while (cur != n) {
        for (int jump = 1; jump <= 2; jump++) {
            int nx = cur + jump;
            if (nx <= n && (ok[nx] || nx == n) && dist[nx] == dist[cur] + 1) {
                path += ('0' + jump);
                cur = nx;
                break;
            }
        }
    }

    printf("%d\n%s\n", (int)path.size(), path.c_str());
    return 0;
}
