/* GAMBIT puzzle pool - every puzzle engine-verified (mate in 1 or forced mate in 2) */
const PUZZLES = [
 {
  "fen": "rnbqkbnr/ppppp2p/5p2/6p1/8/4P3/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
  "type": "m1",
  "rating": 300,
  "theme": "fools mate",
  "id": 0
 },
 {
  "fen": "k7/2K5/8/8/8/8/8/1Q6 w - - 0 1",
  "type": "m1",
  "rating": 300,
  "theme": "queen mate",
  "id": 1
 },
 {
  "fen": "k7/8/1K6/8/8/8/8/7R w - - 0 1",
  "type": "m1",
  "rating": 320,
  "theme": "rook mate",
  "id": 2
 },
 {
  "fen": "7r/8/8/8/8/1k6/8/K7 b - - 0 1",
  "type": "m1",
  "rating": 320,
  "theme": "rook mate",
  "id": 3
 },
 {
  "fen": "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1",
  "type": "m1",
  "rating": 340,
  "theme": "scholars mate",
  "id": 4
 },
 {
  "fen": "7k/R7/1R6/8/8/8/8/6K1 w - - 0 1",
  "type": "m1",
  "rating": 380,
  "theme": "ladder mate",
  "id": 5
 },
 {
  "fen": "1k6/ppp5/8/8/8/8/8/1K2R3 w - - 0 1",
  "type": "m1",
  "rating": 400,
  "theme": "back-rank mate",
  "id": 6
 },
 {
  "fen": "1k2r3/8/8/8/8/8/PPP5/1K6 b - - 0 1",
  "type": "m1",
  "rating": 400,
  "theme": "back-rank mate",
  "id": 7
 },
 {
  "fen": "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
  "type": "m1",
  "rating": 420,
  "theme": "back-rank mate",
  "id": 8
 },
 {
  "fen": "r5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1",
  "type": "m1",
  "rating": 420,
  "theme": "back-rank mate",
  "id": 9
 },
 {
  "fen": "1k6/4QR1P/4p3/8/8/8/8/K7 w - - 0 1",
  "type": "m1",
  "rating": 515,
  "theme": "queen mate",
  "id": 10
 },
 {
  "fen": "3r2k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1",
  "type": "m1",
  "rating": 520,
  "theme": "back-rank mate",
  "id": 11
 },
 {
  "fen": "3q2k1/5ppp/8/8/8/8/5PPP/3R2K1 b - - 0 1",
  "type": "m1",
  "rating": 520,
  "theme": "back-rank mate",
  "id": 12
 },
 {
  "fen": "7k/4P3/1p5K/8/2R5/8/8/8 w - - 0 1",
  "type": "m1",
  "rating": 528,
  "theme": "rook & minor mate",
  "id": 13
 },
 {
  "fen": "7k/5Q2/6K1/8/1P6/5p2/8/8 w - - 0 1",
  "type": "m1",
  "rating": 535,
  "theme": "queen mate",
  "id": 14
 },
 {
  "fen": "8/P7/8/8/p7/q1k5/6p1/1K6 b - - 0 1",
  "type": "m1",
  "rating": 544,
  "theme": "queen mate",
  "id": 15
 },
 {
  "fen": "5k1K/8/8/8/r7/5n2/8/6q1 b - - 0 1",
  "type": "m1",
  "rating": 557,
  "theme": "queen mate",
  "id": 16
 },
 {
  "fen": "6k1/5p1p/5Pp1/8/8/8/8/3Q2K1 w - - 0 1",
  "type": "m1",
  "rating": 560,
  "theme": "back-rank mate",
  "id": 17
 },
 {
  "fen": "K1k5/2p3P1/8/5p2/7Q/8/3R4/8 w - - 0 1",
  "type": "m1",
  "rating": 560,
  "theme": "queen mate",
  "id": 18
 },
 {
  "fen": "8/8/8/8/2R5/4k3/PQ6/4K3 w - - 0 1",
  "type": "m1",
  "rating": 566,
  "theme": "queen mate",
  "id": 19
 },
 {
  "fen": "8/8/2rp4/7P/K1k5/8/8/8 b - - 0 1",
  "type": "m1",
  "rating": 589,
  "theme": "rook & minor mate",
  "id": 20
 },
 {
  "fen": "k7/8/1K6/6Q1/8/8/8/8 w - - 0 1",
  "type": "m1",
  "rating": 605,
  "theme": "queen mate",
  "id": 21
 },
 {
  "fen": "4K3/6q1/3k4/8/8/2r5/3P4/8 b - - 0 1",
  "type": "m1",
  "rating": 622,
  "theme": "queen mate",
  "id": 22
 },
 {
  "fen": "8/P7/8/8/k6K/8/8/1Q6 w - - 0 1",
  "type": "m1",
  "rating": 644,
  "theme": "queen mate",
  "id": 23
 },
 {
  "fen": "8/8/8/8/2r1p3/q2kp3/P7/4K3 b - - 0 1",
  "type": "m1",
  "rating": 646,
  "theme": "queen mate",
  "id": 24
 },
 {
  "fen": "5k2/7P/3K4/8/8/8/Q7/8 w - - 0 1",
  "type": "m1",
  "rating": 654,
  "theme": "queen mate",
  "id": 25
 },
 {
  "fen": "2k5/8/2K5/8/8/5B2/Q7/8 w - - 0 1",
  "type": "m1",
  "rating": 654,
  "theme": "queen mate",
  "id": 26
 },
 {
  "fen": "8/8/2p5/8/7R/K1Q5/6N1/1k6 w - - 0 1",
  "type": "m1",
  "rating": 668,
  "theme": "queen mate",
  "id": 27
 },
 {
  "fen": "6rk/6pp/8/4N3/8/8/8/6K1 w - - 0 1",
  "type": "m1",
  "rating": 680,
  "theme": "smothered mate",
  "id": 28
 },
 {
  "fen": "6QK/8/k4P2/8/8/5p2/1R6/8 w - - 0 1",
  "type": "m1",
  "rating": 686,
  "theme": "queen mate",
  "id": 29
 },
 {
  "fen": "4Q3/1P6/5R2/k7/3N4/P7/2P5/1K6 w - - 0 1",
  "type": "m1",
  "rating": 695,
  "theme": "queen mate",
  "id": 30
 },
 {
  "fen": "8/Pp6/7K/8/8/k2N4/2P1Q3/8 w - - 0 1",
  "type": "m1",
  "rating": 697,
  "theme": "queen mate",
  "id": 31
 },
 {
  "fen": "8/8/2k5/1r6/7p/8/1r5p/2K5 b - - 0 1",
  "type": "m1",
  "rating": 703,
  "theme": "rook & minor mate",
  "id": 32
 },
 {
  "fen": "8/4n2K/5q2/5P2/p7/5k2/1p4r1/8 b - - 0 1",
  "type": "m1",
  "rating": 711,
  "theme": "queen mate",
  "id": 33
 },
 {
  "fen": "7k/8/5N2/8/8/8/8/K5R1 w - - 0 1",
  "type": "m1",
  "rating": 720,
  "theme": "arabian mate",
  "id": 34
 },
 {
  "fen": "8/8/8/8/K7/1Q6/3R4/6kN w - - 0 1",
  "type": "m1",
  "rating": 731,
  "theme": "queen mate",
  "id": 35
 },
 {
  "fen": "8/8/4Q3/4P3/k1K5/8/4P3/5R2 w - - 0 1",
  "type": "m1",
  "rating": 733,
  "theme": "queen mate",
  "id": 36
 },
 {
  "fen": "k7/P6Q/1P6/K6N/3R4/8/5p2/8 w - - 0 1",
  "type": "m1",
  "rating": 734,
  "theme": "queen mate",
  "id": 37
 },
 {
  "fen": "8/R5p1/8/8/4N3/2K5/2Q5/5k2 w - - 0 1",
  "type": "m1",
  "rating": 746,
  "theme": "queen mate",
  "id": 38
 },
 {
  "fen": "5R2/8/1p2P2Q/8/8/6K1/4P3/6k1 w - - 0 1",
  "type": "m1",
  "rating": 747,
  "theme": "queen mate",
  "id": 39
 },
 {
  "fen": "7k/5K2/8/3N4/3p4/8/5PR1/8 w - - 0 1",
  "type": "m1",
  "rating": 764,
  "theme": "rook & minor mate",
  "id": 40
 },
 {
  "fen": "K7/8/1r6/6k1/7p/8/4q3/8 b - - 0 1",
  "type": "m1",
  "rating": 768,
  "theme": "queen mate",
  "id": 41
 },
 {
  "fen": "1k6/4Q2P/8/6K1/8/8/8/4R3 w - - 0 1",
  "type": "m1",
  "rating": 770,
  "theme": "queen mate",
  "id": 42
 },
 {
  "fen": "8/8/8/7K/5q2/8/4k3/6r1 b - - 0 1",
  "type": "m1",
  "rating": 775,
  "theme": "queen mate",
  "id": 43
 },
 {
  "fen": "8/2N5/2R5/k2K4/8/3QPP2/8/8 w - - 0 1",
  "type": "m1",
  "rating": 792,
  "theme": "queen mate",
  "id": 44
 },
 {
  "fen": "3rkr2/8/8/8/8/1Q6/8/4K3 w - - 0 1",
  "type": "m1",
  "rating": 800,
  "theme": "epaulette mate",
  "id": 45
 },
 {
  "fen": "8/8/8/7r/K2p4/2kP3p/8/2r5 b - - 0 1",
  "type": "m1",
  "rating": 803,
  "theme": "rook & minor mate",
  "id": 46
 },
 {
  "fen": "2k2K2/P2p4/4P3/1Q6/8/8/7R/1N6 w - - 0 1",
  "type": "m1",
  "rating": 816,
  "theme": "queen mate",
  "id": 47
 },
 {
  "fen": "4Q3/8/8/8/5K1k/8/3P2p1/8 w - - 0 1",
  "type": "m1",
  "rating": 824,
  "theme": "queen mate",
  "id": 48
 },
 {
  "fen": "K7/8/1k6/8/1n6/8/8/6q1 b - - 0 1",
  "type": "m1",
  "rating": 834,
  "theme": "queen mate",
  "id": 49
 },
 {
  "fen": "8/p2p4/7q/1K6/6P1/1k6/8/8 b - - 0 1",
  "type": "m1",
  "rating": 849,
  "theme": "queen mate",
  "id": 50
 },
 {
  "fen": "7k/8/6Q1/6B1/8/4K3/8/8 w - - 0 1",
  "type": "m1",
  "rating": 868,
  "theme": "queen mate",
  "id": 51
 },
 {
  "fen": "5r2/8/8/1r6/8/8/8/K2k4 b - - 0 1",
  "type": "m1",
  "rating": 873,
  "theme": "rook & minor mate",
  "id": 52
 },
 {
  "fen": "8/8/6B1/2P4K/p1p5/3Q4/8/2k5 w - - 0 1",
  "type": "m1",
  "rating": 875,
  "theme": "queen mate",
  "id": 53
 },
 {
  "fen": "7k/3R1K2/8/8/1P6/6R1/3p2p1/8 w - - 0 1",
  "type": "m1",
  "rating": 888,
  "theme": "rook & minor mate",
  "id": 54
 },
 {
  "fen": "3k4/1K6/R7/8/8/4R3/8/8 w - - 0 1",
  "type": "m1",
  "rating": 912,
  "theme": "rook & minor mate",
  "id": 55
 },
 {
  "fen": "8/8/8/3p1N2/8/pK1Q4/1P6/2k5 w - - 0 1",
  "type": "m1",
  "rating": 912,
  "theme": "queen mate",
  "id": 56
 },
 {
  "fen": "k4N2/8/1K6/8/8/1B6/8/2R5 w - - 0 1",
  "type": "m1",
  "rating": 915,
  "theme": "rook & minor mate",
  "id": 57
 },
 {
  "fen": "8/5R2/R7/7k/4p3/2P3K1/p7/8 w - - 0 1",
  "type": "m1",
  "rating": 923,
  "theme": "rook & minor mate",
  "id": 58
 },
 {
  "fen": "K7/5p2/1k6/4r3/8/p6b/8/6n1 b - - 0 1",
  "type": "m1",
  "rating": 931,
  "theme": "rook & minor mate",
  "id": 59
 },
 {
  "fen": "4n3/7p/3k1b1K/8/1r6/8/8/8 b - - 0 1",
  "type": "m1",
  "rating": 940,
  "theme": "rook & minor mate",
  "id": 60
 },
 {
  "fen": "4K3/8/8/7p/P2N4/Q2p4/R7/6k1 w - - 0 1",
  "type": "m1",
  "rating": 942,
  "theme": "queen mate",
  "id": 61
 },
 {
  "fen": "k7/5Q2/P7/8/4p3/8/R4K2/8 w - - 0 1",
  "type": "m1",
  "rating": 943,
  "theme": "queen mate",
  "id": 62
 },
 {
  "fen": "8/4r3/8/8/k6K/8/3p4/6r1 b - - 0 1",
  "type": "m1",
  "rating": 951,
  "theme": "rook & minor mate",
  "id": 63
 },
 {
  "fen": "7k/5K2/8/5R2/4N3/8/4B3/8 w - - 0 1",
  "type": "m1",
  "rating": 952,
  "theme": "rook & minor mate",
  "id": 64
 },
 {
  "fen": "8/p1p5/8/3p2K1/2R5/8/6Q1/k7 w - - 0 1",
  "type": "m1",
  "rating": 959,
  "theme": "queen mate",
  "id": 65
 },
 {
  "fen": "4K2n/7b/5k2/8/1q6/8/8/8 b - - 0 1",
  "type": "m1",
  "rating": 965,
  "theme": "queen mate",
  "id": 66
 },
 {
  "fen": "8/8/8/4Q3/1B6/7K/8/5k2 w - - 0 1",
  "type": "m1",
  "rating": 968,
  "theme": "queen mate",
  "id": 67
 },
 {
  "fen": "8/8/8/4k1K1/7r/q7/8/8 b - - 0 1",
  "type": "m1",
  "rating": 977,
  "theme": "queen mate",
  "id": 68
 },
 {
  "fen": "7K/7p/6k1/8/8/3q4/8/4b3 b - - 0 1",
  "type": "m1",
  "rating": 982,
  "theme": "queen mate",
  "id": 69
 },
 {
  "fen": "4Q3/k7/8/8/1R6/7K/5p2/8 w - - 0 1",
  "type": "m1",
  "rating": 983,
  "theme": "queen mate",
  "id": 70
 },
 {
  "fen": "R5K1/8/8/7Q/5k2/8/5P2/8 w - - 0 1",
  "type": "m1",
  "rating": 984,
  "theme": "queen mate",
  "id": 71
 },
 {
  "fen": "5k2/1K5P/2P5/7Q/4p3/8/B7/8 w - - 0 1",
  "type": "m1",
  "rating": 985,
  "theme": "queen mate",
  "id": 72
 },
 {
  "fen": "8/1k3p2/2rP4/K7/n1p5/8/1q6/8 b - - 0 1",
  "type": "m1",
  "rating": 989,
  "theme": "queen mate",
  "id": 73
 },
 {
  "fen": "8/8/8/p2n4/K1p5/6pk/1q6/8 b - - 0 1",
  "type": "m1",
  "rating": 990,
  "theme": "queen mate",
  "id": 74
 },
 {
  "fen": "6k1/2R5/8/1K6/8/7Q/8/8 w - - 0 1",
  "type": "m1",
  "rating": 1003,
  "theme": "queen mate",
  "id": 75
 },
 {
  "fen": "7k/7B/8/8/2p5/8/1N2K3/6Q1 w - - 0 1",
  "type": "m1",
  "rating": 1013,
  "theme": "queen mate",
  "id": 76
 },
 {
  "fen": "6q1/1r6/1k6/n6P/p7/K1P5/8/8 b - - 0 1",
  "type": "m1",
  "rating": 1020,
  "theme": "queen mate",
  "id": 77
 },
 {
  "fen": "2k5/8/1Q6/8/4N2K/8/8/5B2 w - - 0 1",
  "type": "m1",
  "rating": 1025,
  "theme": "queen mate",
  "id": 78
 },
 {
  "fen": "1R6/8/8/8/k7/4Q1K1/8/8 w - - 0 1",
  "type": "m1",
  "rating": 1030,
  "theme": "queen mate",
  "id": 79
 },
 {
  "fen": "k7/8/5R2/8/8/4K3/1Q5p/8 w - - 0 1",
  "type": "m1",
  "rating": 1048,
  "theme": "queen mate",
  "id": 80
 },
 {
  "fen": "8/4B1P1/8/6Q1/2K5/2p5/8/4N2k w - - 0 1",
  "type": "m1",
  "rating": 1050,
  "theme": "queen mate",
  "id": 81
 },
 {
  "fen": "8/8/6Q1/8/2pR4/1N1PK3/1p6/7k w - - 0 1",
  "type": "m1",
  "rating": 1050,
  "theme": "queen mate",
  "id": 82
 },
 {
  "fen": "8/P7/8/3Q2p1/3p4/6R1/2K4k/8 w - - 0 1",
  "type": "m1",
  "rating": 1050,
  "theme": "queen mate",
  "id": 83
 },
 {
  "fen": "4k3/1Q6/8/6P1/1P6/4K2R/4N3/8 w - - 0 1",
  "type": "m1",
  "rating": 1050,
  "theme": "queen mate",
  "id": 84
 },
 {
  "fen": "5R2/2Q5/k6P/3N4/8/3K4/8/8 w - - 0 1",
  "type": "m1",
  "rating": 1050,
  "theme": "queen mate",
  "id": 85
 },
 {
  "fen": "3k4/8/8/8/6q1/P5p1/3Pr3/7K b - - 0 1",
  "type": "m2",
  "rating": 1106,
  "theme": "forced mate in 2",
  "id": 86
 },
 {
  "fen": "8/8/2P5/8/7k/8/1R4Q1/7K w - - 0 1",
  "type": "m2",
  "rating": 1136,
  "theme": "forced mate in 2",
  "id": 87
 },
 {
  "fen": "8/6R1/4Q3/8/2K5/8/8/1k6 w - - 0 1",
  "type": "m2",
  "rating": 1244,
  "theme": "forced mate in 2",
  "id": 88
 },
 {
  "fen": "8/1p1pK2k/8/5R2/4Q3/8/1N5P/8 w - - 0 1",
  "type": "m2",
  "rating": 1264,
  "theme": "forced mate in 2",
  "id": 89
 },
 {
  "fen": "5R2/1K6/1P1k4/2N5/p3Q3/1p6/8/8 w - - 0 1",
  "type": "m2",
  "rating": 1277,
  "theme": "forced mate in 2",
  "id": 90
 },
 {
  "fen": "8/8/7K/q4k2/8/8/8/8 b - - 0 1",
  "type": "m2",
  "rating": 1292,
  "theme": "forced mate in 2",
  "id": 91
 },
 {
  "fen": "8/8/8/q1n5/8/5k2/8/6bK b - - 0 1",
  "type": "m2",
  "rating": 1318,
  "theme": "forced mate in 2",
  "id": 92
 },
 {
  "fen": "N7/5R2/1Q6/8/8/6k1/8/6K1 w - - 0 1",
  "type": "m2",
  "rating": 1333,
  "theme": "forced mate in 2",
  "id": 93
 },
 {
  "fen": "8/p4k2/8/3KQ3/3p4/6R1/N7/8 w - - 0 1",
  "type": "m2",
  "rating": 1336,
  "theme": "forced mate in 2",
  "id": 94
 },
 {
  "fen": "8/1P6/8/K7/8/8/1R3p2/k1BN4 w - - 0 1",
  "type": "m2",
  "rating": 1339,
  "theme": "quiet mate in 2",
  "id": 95
 },
 {
  "fen": "8/8/2p5/8/k7/1R4R1/1P6/5K2 w - - 0 1",
  "type": "m2",
  "rating": 1339,
  "theme": "quiet mate in 2",
  "id": 96
 },
 {
  "fen": "1r4k1/5ppp/8/8/Q7/8/5PPP/4R1K1 w - - 0 1",
  "type": "m2",
  "rating": 1350,
  "theme": "deflection",
  "id": 97
 },
 {
  "fen": "8/8/K5p1/5k2/2P5/1q6/1p6/8 b - - 0 1",
  "type": "m2",
  "rating": 1363,
  "theme": "forced mate in 2",
  "id": 98
 },
 {
  "fen": "8/8/4P3/2R5/2R5/4Kpp1/8/k7 w - - 0 1",
  "type": "m2",
  "rating": 1366,
  "theme": "quiet mate in 2",
  "id": 99
 },
 {
  "fen": "8/8/k7/2K5/5Q2/8/8/8 w - - 0 1",
  "type": "m2",
  "rating": 1379,
  "theme": "forced mate in 2",
  "id": 100
 },
 {
  "fen": "8/5r2/r7/6K1/8/5k2/8/8 b - - 0 1",
  "type": "m2",
  "rating": 1388,
  "theme": "quiet mate in 2",
  "id": 101
 },
 {
  "fen": "8/4K3/2Q5/8/B7/8/3k4/3N4 w - - 0 1",
  "type": "m2",
  "rating": 1458,
  "theme": "forced mate in 2",
  "id": 102
 },
 {
  "fen": "8/8/P7/2p5/8/1k1K1Q2/R7/8 w - - 0 1",
  "type": "m2",
  "rating": 1482,
  "theme": "forced mate in 2",
  "id": 103
 },
 {
  "fen": "8/1P2N3/5QB1/7K/8/8/k7/8 w - - 0 1",
  "type": "m2",
  "rating": 1492,
  "theme": "forced mate in 2",
  "id": 104
 },
 {
  "fen": "8/8/5B2/8/8/1K6/p2p1R2/1k6 w - - 0 1",
  "type": "m2",
  "rating": 1608,
  "theme": "quiet mate in 2",
  "id": 105
 },
 {
  "fen": "8/8/8/5p2/8/Q4K2/8/3k3N w - - 0 1",
  "type": "m2",
  "rating": 1613,
  "theme": "forced mate in 2",
  "id": 106
 },
 {
  "fen": "8/8/8/5Rp1/2K2R2/8/4P3/7k w - - 0 1",
  "type": "m2",
  "rating": 1625,
  "theme": "quiet mate in 2",
  "id": 107
 },
 {
  "fen": "R7/8/1B6/8/5K2/7k/8/8 w - - 0 1",
  "type": "m2",
  "rating": 1642,
  "theme": "quiet mate in 2",
  "id": 108
 },
 {
  "fen": "K3b3/4r3/1k6/6p1/2P5/8/8/n7 b - - 0 1",
  "type": "m2",
  "rating": 1667,
  "theme": "quiet mate in 2",
  "id": 109
 },
 {
  "fen": "8/8/r6r/8/8/6K1/8/5k2 b - - 0 1",
  "type": "m2",
  "rating": 1695,
  "theme": "quiet mate in 2",
  "id": 110
 },
 {
  "fen": "8/K5k1/P5r1/8/8/8/1P6/1q6 b - - 0 1",
  "type": "m2",
  "rating": 1739,
  "theme": "forced mate in 2",
  "id": 111
 },
 {
  "fen": "8/4k3/1q6/8/8/3P4/p7/4K3 b - - 0 1",
  "type": "m2",
  "rating": 1800,
  "theme": "forced mate in 2",
  "id": 112
 },
 {
  "fen": "1N2K1k1/8/2Q5/8/4pB2/4P3/4P3/8 w - - 0 1",
  "type": "m2",
  "rating": 1812,
  "theme": "forced mate in 2",
  "id": 113
 },
 {
  "fen": "8/1Q6/8/8/3B4/1p6/1K1k2P1/8 w - - 0 1",
  "type": "m2",
  "rating": 1833,
  "theme": "forced mate in 2",
  "id": 114
 },
 {
  "fen": "8/3R4/5K2/8/6Q1/8/8/5k2 w - - 0 1",
  "type": "m2",
  "rating": 1900,
  "theme": "forced mate in 2",
  "id": 115
 },
 {
  "fen": "q7/7P/8/8/8/5r2/8/1n1K2k1 b - - 0 1",
  "type": "m2",
  "rating": 1900,
  "theme": "forced mate in 2",
  "id": 116
 },
 {
  "fen": "8/1k2K3/N7/8/3Q1B2/8/8/8 w - - 0 1",
  "type": "m2",
  "rating": 1900,
  "theme": "forced mate in 2",
  "id": 117
 },
 {
  "fen": "8/8/1Q6/8/7k/1K6/8/R7 w - - 0 1",
  "type": "m2",
  "rating": 1900,
  "theme": "forced mate in 2",
  "id": 118
 },
 {
  "fen": "1k6/1p6/8/5N2/Q7/8/8/4BK2 w - - 0 1",
  "type": "m2",
  "rating": 1900,
  "theme": "forced mate in 2",
  "id": 119
 },
 {
  "fen": "4k3/K5P1/4Bp2/6R1/4N3/8/8/8 w - - 0 1",
  "type": "m2",
  "rating": 1900,
  "theme": "quiet mate in 2",
  "id": 120
 },
 {
  "fen": "R7/8/1P5P/7k/8/8/3K4/2Q5 w - - 0 1",
  "type": "m2",
  "rating": 1900,
  "theme": "forced mate in 2",
  "id": 121
 }
];
if (typeof module !== "undefined") module.exports = { PUZZLES };
