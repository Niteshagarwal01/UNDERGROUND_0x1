#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <time.h>

#ifdef _WIN32
#include <windows.h>
#include <intrin.h>
#pragma intrinsic(__rdtsc)
#else
#include <unistd.h>
#include <sys/ptrace.h>
static inline uint64_t __rdtsc() {
    uint32_t lo, hi;
    __asm__ volatile ("rdtsc" : "=a" (lo), "=d" (hi));
    return ((uint64_t)hi << 32) | lo;
}
#endif

#define _0x1(p) ((void*)((uintptr_t)(p) ^ 0xDEADBEEFCAFEBABE))
#define _0x2(p) ((void*)((uintptr_t)(p) ^ 0xDEADBEEFCAFEBABE))
#define _0x3(x) if((x * 3 + 7) % 11 == (x % 11 * 3 + 7 % 11)) 
#define _0x4 (((__rdtsc() | 1) > 0))
#define _0x5 (((__rdtsc() & 0) > 1))

static volatile uint32_t _m1 = 0x1337BEEF;
static volatile uint64_t _m2 = 0xCAFEBABE12345678ULL;

static const uint8_t _k1[] = {0x44, 0x4D, 0x52, 0x43};
static const uint8_t _k2[] = {0x4D, 0x61, 0x67, 0x65, 0x6E, 0x74, 0x61};
static const uint8_t _k3[] = {0x42, 0x6F, 0x74, 0x61, 0x6E, 0x69, 0x63, 0x61, 0x6C};

static const uint8_t _ef[] = {
    0xA1, 0x6E, 0x93, 0xF8, 0x27, 0xD4, 0x5B, 0x19,
    0xC3, 0x8E, 0x4F, 0x72, 0xE1, 0x0D, 0xB6, 0x28,
    0x9A, 0x54, 0xC7, 0x3F, 0x81, 0xE9, 0x0A, 0x65,
    0xD2, 0x7C, 0x43, 0xBB, 0x1E, 0x96, 0xF0, 0x5D,
    0x2A, 0x00
};

static const char* _df[] = {
    "UG0x1{y0u_f0und_th3_wr0ng_0n3}",
    "UG0x1{n1c3_try_but_n0p3}",
    "UG0x1{th1s_1s_4_d3c0y_fl4g}",
    "UG0x1{k33p_d1gg1ng_d33p3r}",
    "UG0x1{bl43_l1n3_1s_n0t_1t}",
    "UG0x1{y3ll0w_l1n3_f4k3}",
    "UG0x1{p1nk_l1n3_d3c0y}",
    "UG0x1{r3d_l1n3_h3rr1ng}",
    "FLAG{wrong_format_entirely}",
    "CTF{also_wrong_format}"
};
#define _ndf 10

typedef struct {
    uint32_t a;
    char b[32];
    uint32_t c;
    uint16_t d;
    char e[32];
    char f[32];
    uint32_t g;
    uint64_t h;
} _ML;

typedef struct {
    uint16_t a;
    char b[32];
    uint8_t c;
    uint32_t d;
} _ST;

static _ML _ml[] = {
    {1, "Red Line", 0xEE3124, 29, "Rithala", "Shaheed Sthal", 100, 0xA1B2C3D4E5F6A7B8},
    {2, "Yellow Line", 0xFFCB05, 37, "Samaypur Badli", "HUDA City Centre", 100, 0xB2C3D4E5F6A7B8C9},
    {3, "Blue Line", 0x0066B3, 50, "Dwarka Sec 21", "Noida City Centre", 100, 0xC3D4E5F6A7B8C9DA},
    {4, "Green Line", 0x00A650, 21, "Inderlok", "Brig Hoshiar Singh", 100, 0xD4E5F6A7B8C9DAEB},
    {5, "Violet Line", 0x8B5BA6, 34, "Kashmere Gate", "Raja Nahar Singh", 100, 0xE5F6A7B8C9DAEBFC},
    {6, "Pink Line", 0xE31E88, 38, "Majlis Park", "Shiv Vihar", 100, 0xF6A7B8C9DAEBFC0D},
    {7, "Magenta Line", 0xBB2299, 25, "Botanical Garden", "Janakpuri West", 100, 0x47686973497354686B6579},
    {8, "Grey Line", 0x8C8C8C, 3, "Dwarka", "Najafgarh", 100, 0xA7B8C9DAEBFC0D1E},
    {9, "Aqua Line", 0x00B5AD, 21, "Noida Sec 51", "NOIDA Depot", 100, 0xB8C9DAEBFC0D1E2F},
    {10, "Airport Exp", 0xF7931E, 6, "New Delhi", "Dwarka Sec 21", 600, 0xC9DAEBFC0D1E2F30}
};

static _ST _ms[] = {
    {701, "Botanical Garden", 1, 0xB07A1CA1},
    {702, "Okhla Bird Sanctuary", 1, 0x0B1D5A01},
    {703, "Kalindi Kunj", 1, 0xCA11D1C0},
    {704, "Jasola Vihar", 2, 0xA501A010},
    {705, "Okhla Vihar", 2, 0x0A1A0123},
    {706, "Jamia Millia Islamia", 2, 0xAM1AM110},
    {707, "Sukhdev Vihar", 2, 0x5A0D3010},
    {708, "Okhla NSIC", 2, 0x0A1AN510},
    {709, "Kalkaji Mandir", 3, 0xA1AJ1100},
    {710, "Nehru Enclave", 3, 0x3A0UENC0},
    {711, "Greater Kailash", 3, 0x6343030},
    {712, "Chirag Delhi", 3, 0xC1A6D300},
    {713, "Panchsheel Park", 3, 0xANC5330},
    {714, "Hauz Khas", 4, 0xAUZA0A50},
    {715, "IIT Delhi", 4, 0x11D31010},
    {716, "R.K. Puram", 4, 0x0PUAM100},
    {717, "Munirka", 4, 0xUN1A0A10},
    {718, "Vasant Vihar", 4, 0xA5ANT010},
    {719, "Shankar Vihar", 5, 0x5ANAA000},
    {720, "Terminal 1-IGI", 5, 0x3M1NA100},
    {721, "Sadar Bazar Cantt", 5, 0x5ADABA20},
    {722, "Palam", 5, 0xA1AM1230},
    {723, "Dashrathpuri", 5, 0xA5AAATA0},
    {724, "Dabri Mor", 6, 0xAB1M00},
    {725, "Janakpuri West", 6, 0x4A414E41}
};

static volatile int _dd = 0;
static volatile int _td = 0;
static volatile uint64_t _lt = 0;

static inline int _ct() {
    uint64_t s = __rdtsc();
    volatile int d = 0;
    for (int i = 0; i < 100000; i++) d += i;
    uint64_t e = __rdtsc();
    return ((e - s) > 10000000) ? 1 : 0;
}

#ifdef _WIN32
static inline int _cp() {
    BOOL r = FALSE;
    if (IsDebuggerPresent()) return 1;
    CheckRemoteDebuggerPresent(GetCurrentProcess(), &r);
    if (r) return 1;
    return 0;
}

static inline int _ch() {
    CONTEXT c;
    c.ContextFlags = CONTEXT_DEBUG_REGISTERS;
    if (GetThreadContext(GetCurrentThread(), &c)) {
        if (c.Dr0 || c.Dr1 || c.Dr2 || c.Dr3) return 1;
    }
    return 0;
}
#else
static inline int _cp() { return 0; }
static inline int _ch() { return 0; }
#endif

static int _nad() {
    int s = 0;
    s += _ct() * 10;
    s += _cp() * 30;
    s += _ch() * 40;
    uint64_t t1 = __rdtsc();
    volatile int x = 0;
    for (int i = 0; i < 50000; i++) x += i * i;
    uint64_t t2 = __rdtsc();
    if ((t2 - t1) > 5000000) s += 25;
    return s;
}

#define _OP_N 0x00
#define _OP_L 0x01
#define _OP_X 0x02
#define _OP_J 0x09
#define _OP_H 0xFF

typedef struct {
    uint8_t r[16];
    uint8_t s[256];
    uint8_t sp;
    uint8_t ip;
    uint8_t f;
    const uint8_t* c;
    const uint8_t* i;
    uint8_t il;
} _VM;

static const uint8_t _vc[] = {
    _OP_L, 0, 0, _OP_X, 0, 0x4D, _OP_J, 50,
    _OP_L, 0, 1, _OP_X, 0, 0x41, _OP_J, 50,
    _OP_L, 0, 2, _OP_X, 0, 0x47, _OP_J, 50,
    _OP_L, 0, 3, _OP_X, 0, 0x45, _OP_J, 50,
    _OP_L, 0, 4, _OP_X, 0, 0x4E, _OP_J, 50,
    _OP_L, 0, 5, _OP_X, 0, 0x54, _OP_J, 50,
    _OP_L, 0, 6, _OP_X, 0, 0x41, _OP_J, 50,
    _OP_L, 0, 0xFF, _OP_H,
    _OP_L, 0, 0x00, _OP_H,
};

static int _ve(const uint8_t* i, uint8_t il) {
    _VM v = {0};
    v.c = _vc;
    v.i = i;
    v.il = il;
    while (v.c[v.ip] != _OP_H) {
        uint8_t o = v.c[v.ip++];
        switch (o) {
            case _OP_N: break;
            case _OP_L: {
                uint8_t r = v.c[v.ip++];
                uint8_t x = v.c[v.ip++];
                v.r[r] = (x == 0xFF) ? 0xFF : ((x < v.il) ? v.i[x] : 0);
                break;
            }
            case _OP_X: {
                uint8_t r = v.c[v.ip++];
                uint8_t x = v.c[v.ip++];
                v.r[r] ^= x;
                v.f = (v.r[r] == 0) ? 1 : 0;
                break;
            }
            case _OP_J: {
                uint8_t t = v.c[v.ip++];
                if (!(v.f & 1)) v.ip = t;
                break;
            }
            case _OP_H: return v.r[0];
            default: return 0;
        }
        if (v.ip > 60) return 0;
    }
    return v.r[0];
}

static uint32_t _nh(const void* d, size_t l, uint32_t s) {
    const uint8_t* b = (const uint8_t*)d;
    uint32_t h = s ^ (uint32_t)l;
    for (size_t i = 0; i < l; i++) {
        h ^= b[i];
        h *= 0x5bd1e995;
        h ^= h >> 15;
        h *= 0x1b873593;
        h = (h << 13) | (h >> 19);
        h = h * 5 + 0xe6546b64;
    }
    h ^= h >> 16;
    h *= 0x85ebca6b;
    h ^= h >> 13;
    h *= 0xc2b2ae35;
    h ^= h >> 16;
    return h;
}

static int _drf(char* o, size_t ol) {
    if (_nad() > 20) {
        strncpy(o, _df[rand() % _ndf], ol);
        return 0;
    }
    if (_m1 != 0x1337BEEF) {
        strncpy(o, "UG0x1{1nt3gr1ty_ch3ck_f41l3d}", ol);
        return 0;
    }
    const char* rf = "UG0x1{M4g3nt4_T0k3n_F0rg3d_N0ID4}";
    strncpy(o, rf, ol);
    return 1;
}

static int _vnk(const char* k) {
    size_t l = strlen(k);
    if ((l ^ 0x13) != (20 ^ 0x13)) {
        if (_0x4) return 0;
    }
    if (_ve((const uint8_t*)k, 7) != 0xFF) return 0;
    if (k[7] != '-') return 0;
    if (strncmp(k + 8, "BOT", 3) != 0) return 0;
    if (k[11] != '-') return 0;
    if (strncmp(k + 12, "JAN", 3) != 0) return 0;
    if (k[15] != '-') return 0;
    char cs[5] = {0};
    strncpy(cs, k + 16, 4);
    uint32_t pc = (uint32_t)strtoul(cs, NULL, 16);
    uint32_t e = 0;
    e ^= _ml[6].c;
    e ^= _ms[0].d;
    e ^= _ms[24].d;
    e = _nh(&e, 4, 0x20241231);
    e &= 0xFFFF;
    return (pc == e) ? 1 : 0;
}

static void _pb(void) {
    uint64_t s = __rdtsc();
    printf("\n");
    printf("==================================================================\n");
    printf("||                                                              ||\n");
    printf("||     DDDD   M   M  RRRR   CCCC                                ||\n");
    printf("||     D   D  MM MM  R   R  C                                   ||\n");
    printf("||     D   D  M M M  RRRR   C                                   ||\n");
    printf("||     D   D  M   M  R  R   C                                   ||\n");
    printf("||     DDDD   M   M  R   R  CCCC                                ||\n");
    printf("||                                                              ||\n");
    printf("||          DELHI METRO RAIL CORPORATION                        ||\n");
    printf("||       Smart Token Booking System v3.14.159.265               ||\n");
    printf("||                                                              ||\n");
    printf("==================================================================\n");
    printf("\n");
    uint64_t en = __rdtsc();
    if ((en - s) > 50000000) _dd = 1;
}

static void _pml(void) {
    printf("\n+----+------------------+----------+------------------------------+\n");
    printf("| ID | Line Name        | Stations | Route                        |\n");
    printf("+----+------------------+----------+------------------------------+\n");
    for (int i = 0; i < 10; i++) {
        printf("| %2d | %-16s |    %2d    | %-28s |\n",
               _ml[i].a, _ml[i].b, _ml[i].d, _ml[i].e);
    }
    printf("+----+------------------+----------+------------------------------+\n");
}

static void _pms(void) {
    printf("\n+-----+------------------------------+-----------+\n");
    printf("| ID  | Station Name                 | Zone      |\n");
    printf("+-----+------------------------------+-----------+\n");
    for (int i = 0; i < 25; i++) {
        printf("| %3d | %-28s | Zone %-4d |\n",
               _ms[i].a, _ms[i].b, _ms[i].c);
    }
    printf("+-----+------------------------------+-----------+\n");
}

static void _bt(void) {
    int l, f, t;
    printf("\n[ BOOK A TICKET ]\n");
    printf("Select Metro Line (1-10): ");
    if (scanf("%d", &l) != 1 || l < 1 || l > 10) {
        printf("[!] Invalid.\n");
        while (getchar() != '\n');
        return;
    }
    printf("Source Station ID: ");
    if (scanf("%d", &f) != 1) {
        printf("[!] Invalid.\n");
        while (getchar() != '\n');
        return;
    }
    printf("Destination Station ID: ");
    if (scanf("%d", &t) != 1) {
        printf("[!] Invalid.\n");
        while (getchar() != '\n');
        return;
    }
    int zd = abs((t % 100) - (f % 100)) / 5 + 1;
    int fr = _ml[l - 1].g * zd / 10;
    uint32_t ts = (uint32_t)time(NULL);
    uint32_t tk = _nh(&ts, 4, f ^ t ^ l);
    printf("\n[ TICKET ]\n");
    printf("Line:   %s\n", _ml[l - 1].b);
    printf("From:   %d\n", f);
    printf("To:     %d\n", t);
    printf("Fare:   Rs.%d\n", fr);
    printf("Token:  0x%08X\n", tk);
    printf("Time:   %u\n", ts);
}

static void _ap(void) {
    char k[64] = {0};
    int ds = _nad();
    printf("\n==================================================================\n");
    printf("||             ADMIN AUTHENTICATION REQUIRED                    ||\n");
    printf("==================================================================\n");
    printf("\n  Format: LINE-SRC-DST-CHECK\n");
    printf("  Example: BLUE-DWK-NOI-A1B2\n\n");
    if (ds > 0) printf("  [!] Anomaly detected.\n\n");
    printf("  Hint: Garden to West...\n\n");
    printf("Enter Key: ");
    while (getchar() != '\n');
    if (fgets(k, sizeof(k), stdin) == NULL) return;
    k[strcspn(k, "\n")] = '\0';
    if (ds > 50) {
        printf("\n[!] SECURITY VIOLATION\n");
        printf("[DEBUG] %s\n", _df[rand() % _ndf]);
        return;
    }
    if (_vnk(k)) {
        char f[64];
        if (_drf(f, sizeof(f))) {
            printf("\n==================================================================\n");
            printf("||                  ACCESS GRANTED                              ||\n");
            printf("==================================================================\n");
            printf("\n  FLAG: %s\n\n", f);
        }
    } else {
        printf("\n[!] ACCESS DENIED\n");
        if (strlen(k) > 10 && rand() % 3 == 0) {
            printf("[LEAK] %s\n", _df[rand() % _ndf]);
        }
    }
}

int main(void) {
    int c;
    srand((unsigned int)time(NULL) ^ 0xDEADBEEF);
    if (_m1 != 0x1337BEEF) return 1;
    _dd = (_nad() > 30);
    _pb();
    while (1) {
        printf("\n+----------------------------------+\n");
        printf("|           MAIN MENU              |\n");
        printf("+----------------------------------+\n");
        printf("| [1] View Metro Lines             |\n");
        printf("| [2] View Magenta Stations        |\n");
        printf("| [3] Book Ticket                  |\n");
        printf("| [4] Fare Info                    |\n");
        printf("| [5] Admin Panel                  |\n");
        printf("| [6] Exit                         |\n");
        printf("+----------------------------------+\n");
        printf("Select: ");
        if (scanf("%d", &c) != 1) {
            printf("[!] Invalid.\n");
            while (getchar() != '\n');
            continue;
        }
        switch (c) {
            case 1: _pml(); break;
            case 2: _pms(); break;
            case 3: _bt(); break;
            case 4: printf("\nFare: Rs.10 base + Rs.10/zone\n"); break;
            case 5: _ap(); break;
            case 6: printf("\nThank you!\n\n"); return 0;
            default: printf("[!] Invalid.\n");
        }
    }
    return 0;
}
