#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <time.h>

#ifdef _WIN32
#include <windows.h>
#include <intrin.h>
#pragma intrinsic(__rdtsc)
#define NOINLINE __declspec(noinline)
#else
#include <unistd.h>
#include <sys/ptrace.h>
#define NOINLINE __attribute__((noinline))
static inline uint64_t __rdtsc() {
    uint32_t lo, hi;
    __asm__ volatile ("rdtsc" : "=a" (lo), "=d" (hi));
    return ((uint64_t)hi << 32) | lo;
}
#endif

#define ROL8(x, n) (((x) << (n)) | ((x) >> (8 - (n))))
#define ROR8(x, n) (((x) >> (n)) | ((x) << (8 - (n))))
#define ROL32(x, n) (((x) << (n)) | ((x) >> (32 - (n))))
#define ROR32(x, n) (((x) >> (n)) | ((x) << (32 - (n))))
#define ALWAYS_TRUE  (((__rdtsc() | 1) > 0))
#define ALWAYS_FALSE (((__rdtsc() & 0) > 1))
#define CONFUSE(x) ((x) ^ (ALWAYS_TRUE ? 0 : 0xDEAD))

static volatile uint32_t _m1 = 0x1337BEEF;
static volatile uint64_t _m2 = 0xCAFEBABE12345678ULL;
static volatile uint32_t _ds = 0;
static volatile uint64_t _tb = 0;
static volatile uint32_t _ef = 0;
static volatile uint8_t _ts[8] = {0};
static volatile uint8_t _ti = 0;

static const uint8_t SB[256] = {
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
};

static const uint8_t ISB[256] = {
    0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
    0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
    0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
    0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
    0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
    0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
    0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
    0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
    0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
    0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
    0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
    0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
    0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
    0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
    0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
    0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
};

static const uint8_t _dfe[20][32] = {
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x0A,0x5D,0x3A,0x75,0x0C,0x5D,0x3A,0x55,0x17,0x00,0x54,0x38,0x3B,0x18,0x5D,0x55,0x5D,0x18,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x1C,0x5E,0x34,0x52,0x18,0x59,0x3A,0x5E,0x17,0x1A,0x3A,0x38,0x00,0x5D,0x5F,0x54,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x38,0x57,0x5E,0x36,0x18,0x5E,0x36,0x18,0x57,0x1A,0x52,0x54,0x34,0x5D,0x3A,0x00,0x1C,0x5E,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x19,0x52,0x52,0x3F,0x18,0x51,0x5E,0x50,0x50,0x05,0x5D,0x50,0x00,0x52,0x54,0x3F,0x54,0x3B,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x10,0x57,0x3A,0x52,0x18,0x5E,0x5E,0x55,0x54,0x18,0x5E,0x36,0x00,0x55,0x5D,0x38,0x00,0x5E,0x38,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x0B,0x52,0x57,0x57,0x5D,0x39,0x00,0x5E,0x5E,0x55,0x54,0x18,0x0C,0x56,0x19,0x54,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x3E,0x5E,0x55,0x5A,0x18,0x5E,0x5E,0x55,0x54,0x18,0x51,0x54,0x34,0x5D,0x3A,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x3A,0x52,0x51,0x18,0x5E,0x5E,0x55,0x54,0x18,0x56,0x52,0x3B,0x3B,0x5E,0x55,0x50,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x15,0x3B,0x52,0x52,0x55,0x18,0x5E,0x5E,0x55,0x54,0x18,0x38,0x3B,0x56,0x3F,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x3E,0x5E,0x5D,0x57,0x54,0x38,0x00,0x5E,0x5E,0x55,0x54,0x18,0x0C,0x56,0x19,0x54,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x15,0x3B,0x52,0x0B,0x18,0x5E,0x5E,0x55,0x54,0x18,0x55,0x5D,0x3F,0x54,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x57,0x3D,0x3A,0x56,0x18,0x5E,0x5E,0x55,0x54,0x18,0x39,0x3B,0x5D,0x55,0x50,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x57,0x5E,0x3B,0x3F,0x5D,0x3B,0x38,0x18,0x54,0x3B,0x3F,0x3B,0x54,0x36,0x36,0x18,0x0C,0x56,0x5E,0x5E,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x12,0x52,0x10,0x3A,0x50,0x50,0x52,0x3B,0x18,0x51,0x54,0x38,0x54,0x34,0x38,0x54,0x51,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x38,0x5E,0x5C,0x5E,0x55,0x50,0x18,0x34,0x56,0x54,0x34,0x19,0x18,0x0C,0x56,0x5E,0x5E,0x54,0x51,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x5E,0x55,0x38,0x52,0x50,0x3B,0x5E,0x38,0x0B,0x18,0x3E,0x5E,0x5D,0x57,0x56,0x38,0x5E,0x5D,0x55,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x3E,0x5C,0x18,0x52,0x3B,0x52,0x34,0x3A,0x38,0x5E,0x5D,0x55,0x18,0x52,0x3B,0x3B,0x5D,0x3B,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x36,0x5D,0x18,0x34,0x5E,0x5D,0x36,0x54,0x18,0x0B,0x54,0x38,0x18,0x36,0x5D,0x18,0x0C,0x56,0x3B,0x00},
    {0x32,0x24,0x5D,0x3B,0x5E,0x38,0x57,0x57,0x5C,0x5D,0x36,0x38,0x18,0x38,0x56,0x54,0x3B,0x54,0x18,0x10,0x3A,0x38,0x18,0x55,0x5D,0x00},
    {0x23,0x2F,0x20,0x24,0x38,0x39,0x3B,0x5D,0x55,0x50,0x18,0x0C,0x5D,0x3B,0x5C,0x56,0x38,0x18,0x54,0x55,0x38,0x5E,0x3B,0x54,0x5E,0x0B,0x00}
};
static const uint8_t _dfl[20] = {25,23,25,25,26,23,22,23,22,23,21,22,27,24,26,26,25,26,26,27};
#define _ndf 20

NOINLINE static void _gdf(int idx, char* out) {
    uint8_t k = 0x4D ^ 0x55 ^ 0x17;
    for (int i = 0; i < _dfl[idx] && i < 31; i++) {
        out[i] = _dfe[idx][i] ^ (k + (i % 5));
    }
    out[_dfl[idx]] = '\0';
}

typedef struct {
    uint32_t a; char b[32]; uint32_t c; uint16_t d;
    char e[32]; char f[32]; uint32_t g; uint64_t h; uint32_t i;
} _ML;

typedef struct {
    uint16_t a; char b[32]; uint8_t c; uint32_t d; uint64_t e;
} _ST;

static _ML _ml[] = {
    {1, "Red Line", 0xEE3124, 29, "Rithala", "Shaheed Sthal", 100, 0xA1B2C3D4E5F6A7B8, 0x12345678},
    {2, "Yellow Line", 0xFFCB05, 37, "Samaypur Badli", "HUDA City Centre", 100, 0xB2C3D4E5F6A7B8C9, 0x23456789},
    {3, "Blue Line", 0x0066B3, 50, "Dwarka Sec 21", "Noida City Centre", 100, 0xC3D4E5F6A7B8C9DA, 0x3456789A},
    {4, "Green Line", 0x00A650, 21, "Inderlok", "Brig Hoshiar Singh", 100, 0xD4E5F6A7B8C9DAEB, 0x456789AB},
    {5, "Violet Line", 0x8B5BA6, 34, "Kashmere Gate", "Raja Nahar Singh", 100, 0xE5F6A7B8C9DAEBFC, 0x56789ABC},
    {6, "Pink Line", 0xE31E88, 38, "Majlis Park", "Shiv Vihar", 100, 0xF6A7B8C9DAEBFC0D, 0x6789ABCD},
    {7, "Magenta Line", 0xBB2299, 25, "Botanical Garden", "Janakpuri West", 100, 0x5448495349534B45, 0x789ABCDE},
    {8, "Grey Line", 0x8C8C8C, 3, "Dwarka", "Najafgarh", 100, 0xA7B8C9DAEBFC0D1E, 0x89ABCDEF},
    {9, "Aqua Line", 0x00B5AD, 21, "Noida Sec 51", "NOIDA Depot", 100, 0xB8C9DAEBFC0D1E2F, 0x9ABCDEF0},
    {10, "Airport Exp", 0xF7931E, 6, "New Delhi", "Dwarka Sec 21", 600, 0xC9DAEBFC0D1E2F30, 0xABCDEF01}
};

static _ST _ms[] = {
    {701, "Botanical Garden", 1, 0xB07A1CA1, 0x424F54414E494341},
    {702, "Okhla Bird Sanctuary", 1, 0x0B1D5A01, 0},
    {703, "Kalindi Kunj", 1, 0xCA11D1C0, 0},
    {704, "Jasola Vihar", 2, 0xA501A010, 0},
    {705, "Okhla Vihar", 2, 0x0A1A0123, 0},
    {706, "Jamia Millia Islamia", 2, 0xAA1AA110, 0},
    {707, "Sukhdev Vihar", 2, 0x5A0D3010, 0},
    {708, "Okhla NSIC", 2, 0x0A1A5510, 0},
    {709, "Kalkaji Mandir", 3, 0xA1AE1100, 0},
    {710, "Nehru Enclave", 3, 0x3A0EAEC0, 0},
    {711, "Greater Kailash", 3, 0x67434030, 0},
    {712, "Chirag Delhi", 3, 0xC1A6D300, 0},
    {713, "Panchsheel Park", 3, 0xAAC55330, 0},
    {714, "Hauz Khas", 4, 0xAAEA0A50, 0},
    {715, "IIT Delhi", 4, 0x11D31010, 0},
    {716, "R.K. Puram", 4, 0x0FEAA100, 0},
    {717, "Munirka", 4, 0xEE1A0A10, 0},
    {718, "Vasant Vihar", 4, 0xA5AAE010, 0},
    {719, "Shankar Vihar", 5, 0x5AAAA000, 0},
    {720, "Terminal 1-IGI", 5, 0x3E1AA100, 0},
    {721, "Sadar Bazar Cantt", 5, 0x5ADABA20, 0},
    {722, "Palam", 5, 0xA1AB1230, 0},
    {723, "Dashrathpuri", 5, 0xA5AAAAA0, 0},
    {724, "Dabri Mor", 6, 0xDAB11000, 0},
    {725, "Janakpuri West", 6, 0x4A414E41, 0x4A414E414B505552}
};

NOINLINE static int _ct1() {
    uint64_t t1 = __rdtsc();
    volatile int s = 0;
    for (int i = 0; i < 100000; i++) s += i;
    uint64_t t2 = __rdtsc();
    return ((t2 - t1) > 15000000) ? 15 : 0;
}

NOINLINE static int _ct2() {
    uint64_t t[5];
    for (int i = 0; i < 5; i++) {
        uint64_t t1 = __rdtsc();
        volatile int x = 0;
        for (int j = 0; j < 10000; j++) x += j;
        t[i] = __rdtsc() - t1;
    }
    uint64_t md = 0;
    for (int i = 1; i < 5; i++) {
        uint64_t d = (t[i] > t[i-1]) ? (t[i] - t[i-1]) : (t[i-1] - t[i]);
        if (d > md) md = d;
    }
    return (md > 5000000) ? 10 : 0;
}

#ifdef _WIN32
NOINLINE static int _cdp() {
    if (IsDebuggerPresent()) return 30;
    BOOL r = FALSE;
    CheckRemoteDebuggerPresent(GetCurrentProcess(), &r);
    if (r) return 30;
    return 0;
}

NOINLINE static int _chb() {
    CONTEXT c;
    c.ContextFlags = CONTEXT_DEBUG_REGISTERS;
    if (GetThreadContext(GetCurrentThread(), &c)) {
        if (c.Dr0 || c.Dr1 || c.Dr2 || c.Dr3) return 40;
        if (c.Dr7 & 0xFF) return 40;
    }
    return 0;
}

NOINLINE static int _cpf() {
    BOOL b = FALSE;
    __try {
        PPEB p = (PPEB)__readgsqword(0x60);
        b = p->BeingDebugged;
    } __except(EXCEPTION_EXECUTE_HANDLER) {}
    return b ? 25 : 0;
}

NOINLINE static int _chf() {
    DWORD f = 0;
    __try {
        PPEB p = (PPEB)__readgsqword(0x60);
        PVOID h = p->ProcessHeap;
        f = *(DWORD*)((PBYTE)h + 0x70);
    } __except(EXCEPTION_EXECUTE_HANDLER) {}
    return (f & 0x70000062) ? 20 : 0;
}

NOINLINE static int _cng() {
    DWORD n = 0;
    __try {
        PPEB p = (PPEB)__readgsqword(0x60);
        n = p->NtGlobalFlag;
    } __except(EXCEPTION_EXECUTE_HANDLER) {}
    return (n & 0x70) ? 25 : 0;
}
#else
NOINLINE static int _cdp() { if (ptrace(PTRACE_TRACEME, 0, 1, 0) == -1) return 30; return 0; }
NOINLINE static int _chb() { return 0; }
NOINLINE static int _cpf() { return 0; }
NOINLINE static int _chf() { return 0; }
NOINLINE static int _cng() { return 0; }
#endif

NOINLINE static int _cbi() {
    uint8_t* p = (uint8_t*)&_ct1;
    int s = 0;
    for (int i = 0; i < 64; i++) if (p[i] == 0xCC) s += 50;
    return s;
}

NOINLINE static int _cmi() {
    if (_m1 != 0x1337BEEF) return 100;
    if (_m2 != 0xCAFEBABE12345678ULL) return 100;
    return 0;
}

NOINLINE static int _nad() {
    int s = 0;
    s += _ct1(); s += _ct2(); s += _cdp();
    s += _chb(); s += _cpf(); s += _chf();
    s += _cng(); s += _cbi(); s += _cmi();
    _ds = s;
    return s;
}

#define _ON 0x00
#define _OL 0x01
#define _OS 0x02
#define _OX 0x03
#define _OA 0x06
#define _OB 0x07
#define _OR 0x08
#define _OZ 0x0B
#define _OJ 0x0C
#define _OH 0xFF

typedef struct {
    uint8_t r[16]; uint8_t s[256]; uint8_t sp;
    uint16_t ip; uint8_t f; const uint8_t* c;
    uint16_t cl; const uint8_t* i; uint8_t il;
} _VM;

static const uint8_t _vc[] = {
    _OL, 0, 0xFF, _OX, 0, 20, _OJ, 0, 200,
    _OL, 0, 0, _OX, 0, 0x4D, _OJ, 0, 200,
    _OL, 0, 1, _OX, 0, 0x41, _OJ, 0, 200,
    _OL, 0, 2, _OX, 0, 0x47, _OJ, 0, 200,
    _OL, 0, 3, _OX, 0, 0x45, _OJ, 0, 200,
    _OL, 0, 4, _OX, 0, 0x4E, _OJ, 0, 200,
    _OL, 0, 5, _OX, 0, 0x54, _OJ, 0, 200,
    _OL, 0, 6, _OX, 0, 0x41, _OJ, 0, 200,
    _OL, 0, 7, _OX, 0, 0x2D, _OJ, 0, 200,
    _OL, 0, 8, _OX, 0, 0x42, _OJ, 0, 200,
    _OL, 0, 9, _OX, 0, 0x4F, _OJ, 0, 200,
    _OL, 0, 10, _OX, 0, 0x54, _OJ, 0, 200,
    _OL, 0, 11, _OX, 0, 0x2D, _OJ, 0, 200,
    _OL, 0, 12, _OX, 0, 0x4A, _OJ, 0, 200,
    _OL, 0, 13, _OX, 0, 0x41, _OJ, 0, 200,
    _OL, 0, 14, _OX, 0, 0x4E, _OJ, 0, 200,
    _OL, 0, 15, _OX, 0, 0x2D, _OJ, 0, 200,
    _OS, 0, 0xFF, _OH,
    _OS, 0, 0x00, _OH
};

NOINLINE static int _ve(const uint8_t* i, uint8_t il) {
    _VM v = {0};
    v.c = _vc; v.cl = sizeof(_vc); v.i = i; v.il = il;
    int cy = 0;
    while (v.ip < v.cl && cy < 10000) {
        uint8_t o = v.c[v.ip++]; cy++;
        switch (o) {
            case _ON: break;
            case _OL: { uint8_t r = v.c[v.ip++]; uint8_t x = v.c[v.ip++];
                v.r[r] = (x == 0xFF) ? v.il : ((x < v.il) ? v.i[x] : 0); break; }
            case _OS: { uint8_t r = v.c[v.ip++]; uint8_t x = v.c[v.ip++];
                v.r[r] = x; break; }
            case _OX: { uint8_t r = v.c[v.ip++]; uint8_t x = v.c[v.ip++];
                v.r[r] ^= x; v.f = (v.r[r] == 0) ? 1 : 0; break; }
            case _OZ: { v.ip++; uint8_t t = v.c[v.ip++];
                if (v.f & 1) v.ip = t; break; }
            case _OJ: { v.ip++; uint8_t t = v.c[v.ip++];
                if (!(v.f & 1)) v.ip = t; break; }
            case _OH: return v.r[0];
            default: return 0;
        }
    }
    return v.r[0];
}

NOINLINE static uint32_t _nh(const void* d, size_t l, uint32_t s) {
    const uint8_t* b = (const uint8_t*)d;
    uint32_t h = s ^ (uint32_t)l;
    for (size_t i = 0; i < l; i++) {
        h ^= SB[b[i]];
        h *= 0x5bd1e995; h ^= h >> 15;
        h *= 0x1b873593; h = ROL32(h, 13);
        h = h * 5 + 0xe6546b64;
    }
    h ^= h >> 16; h *= 0x85ebca6b;
    h ^= h >> 13; h *= 0xc2b2ae35;
    h ^= h >> 16; h ^= 0xDEADC0DE;
    h = ROL32(h, 7); h *= 0x1337CAFE;
    return h;
}

static const uint8_t _ef[] = {
    0x18,0x24,0x5D,0x3B,0x5E,0x38,0x20,0x56,0x5E,0x50,0x18,0x54,0x5D,0x58,0x14,
    0x17,0x5D,0x55,0x54,0x18,0x50,0x05,0x5D,0x18,0x52,0x54,0x50,0x17,0x05,0x5D,
    0x23,0x5C,0x21,0x27,0x5E,0x30
};

NOINLINE static int _drf(char* o, size_t ol) {
    if (_nad() > 30) { _gdf(rand() % _ndf, o); return 0; }
    if (_m1 != 0x1337BEEF) { _gdf(13, o); return 0; }
    uint8_t k = 0x4D ^ 0x55;
    for (size_t i = 0; i < 34 && i < ol - 1; i++) {
        o[i] = _ef[i] ^ (k + (i % 7));
    }
    o[34] = '\0';
    return 1;
}

NOINLINE static uint16_t _cc(uint32_t lc, uint32_t sc, uint32_t dc) {
    uint32_t cm = lc ^ sc ^ dc;
    uint32_t h = _nh(&cm, 4, 0x20241231);
    return (uint16_t)(h & 0xFFFF);
}

NOINLINE static int _vnk(const char* k) {
    volatile size_t l = strlen(k);
    volatile uint32_t v1 = (l * 0x1337) ^ 0x19A60;
    if (v1 != ((20 * 0x1337) ^ 0x19A60)) { if (ALWAYS_TRUE) return 0; }
    if (_ve((const uint8_t*)k, 16) != 0xFF) return 0;
    volatile uint8_t s1 = k[7] ^ 0x2D, s2 = k[11] ^ 0x2D, s3 = k[15] ^ 0x2D;
    if ((s1 | s2 | s3) != 0) return 0;
    volatile uint32_t h1 = ((uint32_t)k[8] << 16) | ((uint32_t)k[9] << 8) | k[10];
    volatile uint32_t h2 = ((uint32_t)k[12] << 16) | ((uint32_t)k[13] << 8) | k[14];
    volatile uint32_t e1 = 0x424F54, e2 = 0x4A414E;
    if ((h1 ^ e1) != 0 || (h2 ^ e2) != 0) return 0;
    volatile uint8_t c0 = k[16], c1 = k[17], c2 = k[18], c3 = k[19];
    volatile uint32_t pv = 0;
    pv |= ((c0 >= '0' && c0 <= '9') ? (c0 - '0') : ((c0 >= 'A' && c0 <= 'F') ? (c0 - 'A' + 10) : ((c0 >= 'a' && c0 <= 'f') ? (c0 - 'a' + 10) : 0))) << 12;
    pv |= ((c1 >= '0' && c1 <= '9') ? (c1 - '0') : ((c1 >= 'A' && c1 <= 'F') ? (c1 - 'A' + 10) : ((c1 >= 'a' && c1 <= 'f') ? (c1 - 'a' + 10) : 0))) << 8;
    pv |= ((c2 >= '0' && c2 <= '9') ? (c2 - '0') : ((c2 >= 'A' && c2 <= 'F') ? (c2 - 'A' + 10) : ((c2 >= 'a' && c2 <= 'f') ? (c2 - 'a' + 10) : 0))) << 4;
    pv |= ((c3 >= '0' && c3 <= '9') ? (c3 - '0') : ((c3 >= 'A' && c3 <= 'F') ? (c3 - 'A' + 10) : ((c3 >= 'a' && c3 <= 'f') ? (c3 - 'a' + 10) : 0)));
    volatile uint32_t lc = _ml[6].c, sc = _ms[0].d, dc = _ms[24].d;
    volatile uint32_t cm = lc ^ sc ^ dc;
    volatile uint32_t hv = _nh(&cm, 4, 0x20241231);
    volatile uint16_t ev = (uint16_t)(hv & 0xFFFF);
    return ((pv ^ ev) == 0) ? 1 : 0;
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
    printf("||       Smart Token Booking System v6.66.666                   ||\n");
    printf("||                                                              ||\n");
    printf("==================================================================\n");
    printf("\n");
    uint64_t e = __rdtsc();
    if ((e - s) > 100000000) _ds += 20;
}

static void _pml(void) {
    printf("\n+----+------------------+----------+------------------------------+\n");
    printf("| ID | Line Name        | Stations | Route                        |\n");
    printf("+----+------------------+----------+------------------------------+\n");
    for (int i = 0; i < 10; i++) {
        printf("| %2d | %-16s |    %2d    | %-12s -> %-12s |\n",
               _ml[i].a, _ml[i].b, _ml[i].d, _ml[i].e, _ml[i].f);
    }
    printf("+----+------------------+----------+------------------------------+\n");
}

static void _pms(void) {
    printf("\n+-----+------------------------------+-----------+\n");
    printf("| ID  | Station Name                 | Zone      |\n");
    printf("+-----+------------------------------+-----------+\n");
    for (int i = 0; i < 25; i++) {
        printf("| %3d | %-28s | Zone %-4d |\n", _ms[i].a, _ms[i].b, _ms[i].c);
    }
    printf("+-----+------------------------------+-----------+\n");
}

static void _bt(void) {
    int l, f, t;
    printf("\n[ BOOK A TICKET ]\n");
    printf("Select Metro Line (1-10): ");
    if (scanf("%d", &l) != 1 || l < 1 || l > 10) {
        printf("[!] Invalid.\n"); while (getchar() != '\n'); return;
    }
    printf("Source Station ID: ");
    if (scanf("%d", &f) != 1) { printf("[!] Invalid.\n"); while (getchar() != '\n'); return; }
    printf("Destination Station ID: ");
    if (scanf("%d", &t) != 1) { printf("[!] Invalid.\n"); while (getchar() != '\n'); return; }
    int zd = abs((t % 100) - (f % 100)) / 5 + 1;
    int fr = _ml[l - 1].g * zd / 10;
    uint32_t ts = (uint32_t)time(NULL);
    uint32_t tk = _nh(&ts, 4, f ^ t ^ l);
    printf("\n[ TICKET ]\n");
    printf("Line:   %s\n", _ml[l - 1].b);
    printf("From:   %d\nTo:     %d\n", f, t);
    printf("Fare:   Rs.%d\n", fr);
    printf("Token:  0x%08X\n", tk);
    printf("Time:   %u\n", ts);
}

static void _ap(void) {
    char k[64] = {0};
    int dl = _nad();
    printf("\n==================================================================\n");
    printf("||             ADMIN AUTHENTICATION REQUIRED                    ||\n");
    printf("==================================================================\n");
    printf("\n  Format: LINE-SRC-DST-CHECK (20 chars)\n");
    printf("  Example: YELLOW-SAM-HUD-A1B2\n\n");
    if (dl > 0) printf("  [!] Security: %d anomalies.\n", dl / 10);
    printf("  [?] The purple route holds secrets...\n");
    printf("  [?] From where life blooms to where the sun sets...\n\n");
    printf("Enter Key: ");
    while (getchar() != '\n');
    if (fgets(k, sizeof(k), stdin) == NULL) return;
    k[strcspn(k, "\n")] = '\0';
    _ts[_ti++ % 8] = (uint8_t)strlen(k);
    if (dl > 60) {
        char tf[64]; _gdf(rand() % _ndf, tf);
        printf("\n[!] SECURITY VIOLATION\n");
        printf("[LEAK] %s\n", tf);
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
        if (strlen(k) > 10 && rand() % 4 == 0) {
            char tf[64]; _gdf(rand() % _ndf, tf);
            printf("[TRACE] Partial match...\n");
            printf("[LEAK] %s\n", tf);
        }
    }
}

int main(void) {
    int c;
    srand((unsigned int)time(NULL) ^ 0xDEADBEEF);
    _tb = __rdtsc();
    _ef = _nh(&_tb, 8, 0x12345678);
    if (_m1 != 0x1337BEEF) return 1;
    _ds = _nad();
    _pb();
    while (1) {
        printf("\n+----------------------------------+\n");
        printf("|           MAIN MENU              |\n");
        printf("+----------------------------------+\n");
        printf("| [1] View Metro Lines             |\n");
        printf("| [2] View Magenta Stations        |\n");
        printf("| [3] Book Ticket                  |\n");
        printf("| [4] Fare Information             |\n");
        printf("| [5] Admin Panel                  |\n");
        printf("| [6] Exit                         |\n");
        printf("+----------------------------------+\n");
        printf("Select: ");
        if (scanf("%d", &c) != 1) { printf("[!] Invalid.\n"); while (getchar() != '\n'); continue; }
        if (_m1 != 0x1337BEEF) { printf("[!] Integrity error.\n"); return 1; }
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
