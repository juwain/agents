#include <cstdio>
#include <vector>
#include <deque>
#include <algorithm>
#include <climits>
using namespace std;

int main() {
    int n, m;
    scanf("%d %d", &n, &m);

    vector<pair<int,int>> items; // (value, epoch)
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++) {
            int a;
            scanf("%d", &a);
            items.push_back({a, i});
        }

    sort(items.begin(), items.end());

    int total = n * m;
    vector<deque<int>> eq(n); // values per epoch in window
    int covered = 0;
    long long cur_sum = 0;
    long long best_range = LLONG_MAX, best_sum = LLONG_MAX;
    int bl = -1, br = -1;

    for (int l = 0, r = 0; r < total; r++) {
        auto [v, ep] = items[r];
        if (eq[ep].empty()) { covered++; cur_sum += v; }
        eq[ep].push_back(v);

        while (covered == n) {
            long long rng = (long long)items[r].first - items[l].first;
            if (rng < best_range || (rng == best_range && cur_sum < best_sum)) {
                best_range = rng;
                best_sum = cur_sum;
                bl = l; br = r;
            }
            auto [lv, le] = items[l];
            eq[le].pop_front();
            if (eq[le].empty()) { covered--; cur_sum -= lv; }
            else cur_sum += eq[le].front() - lv;
            l++;
        }
    }

    // Reconstruct: pick first (minimum) occurrence per epoch in [bl, br]
    vector<int> sel(n, -1);
    for (int i = bl; i <= br; i++) {
        auto [v, ep] = items[i];
        if (sel[ep] == -1) sel[ep] = v;
    }

    sort(sel.begin(), sel.end());
    for (int i = 0; i < n; i++)
        printf("%d%c", sel[i], " \n"[i == n - 1]);
}
