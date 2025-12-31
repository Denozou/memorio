package com.memorio.backend.gamification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("TreeCalculator Unit Tests")
class TreeCalculatorTest {

    private TreeCalculator treeCalculator;

    @BeforeEach
    void setUp() {
        treeCalculator = new TreeCalculator();
    }

    @Nested
    @DisplayName("calculateTrees tests")
    class CalculateTreesTests {

        @Test
        @DisplayName("Should return 0 trees for less than 100 points")
        void shouldReturn0TreesForLessThan100Points() {
            assertEquals(0, treeCalculator.calculateTrees(0));
            assertEquals(0, treeCalculator.calculateTrees(50));
            assertEquals(0, treeCalculator.calculateTrees(99));
        }

        @ParameterizedTest
        @CsvSource({
            "100, 1",
            "200, 2",
            "300, 3",
            "400, 4",
            "499, 4"
        })
        @DisplayName("Should calculate trees correctly for 100-499 points range")
        void shouldCalculateTreesFor100To499Points(long points, int expectedTrees) {
            assertEquals(expectedTrees, treeCalculator.calculateTrees(points));
        }

        @ParameterizedTest
        @CsvSource({
            "500, 5",
            "650, 6",
            "800, 7",
            "1999, 14"
        })
        @DisplayName("Should calculate trees correctly for 500-1999 points range")
        void shouldCalculateTreesFor500To1999Points(long points, int expectedTrees) {
            assertEquals(expectedTrees, treeCalculator.calculateTrees(points));
        }

        @ParameterizedTest
        @CsvSource({
            "2000, 15",
            "2200, 16",
            "4999, 29"
        })
        @DisplayName("Should calculate trees correctly for 2000-4999 points range")
        void shouldCalculateTreesFor2000To4999Points(long points, int expectedTrees) {
            assertEquals(expectedTrees, treeCalculator.calculateTrees(points));
        }

        @ParameterizedTest
        @CsvSource({
            "5000, 30",
            "5250, 31",
            "9999, 49"
        })
        @DisplayName("Should calculate trees correctly for 5000-9999 points range")
        void shouldCalculateTreesFor5000To9999Points(long points, int expectedTrees) {
            assertEquals(expectedTrees, treeCalculator.calculateTrees(points));
        }

        @ParameterizedTest
        @CsvSource({
            "10000, 50",
            "10500, 51",
            "15000, 60",
            "100000, 230"
        })
        @DisplayName("Should calculate trees correctly for 10000+ points")
        void shouldCalculateTreesFor10000PlusPoints(long points, int expectedTrees) {
            assertEquals(expectedTrees, treeCalculator.calculateTrees(points));
        }
    }

    @Nested
    @DisplayName("calculateLevel tests")
    class CalculateLevelTests {

        @ParameterizedTest
        @CsvSource({
            "0, 1",
            "5, 1",
            "9, 1",
            "10, 2",
            "15, 2",
            "19, 2",
            "20, 3",
            "50, 6",
            "99, 10"
        })
        @DisplayName("Should calculate level correctly based on trees")
        void shouldCalculateLevelCorrectly(int trees, int expectedLevel) {
            assertEquals(expectedLevel, TreeCalculator.calculateLevel(trees));
        }
    }

    @Nested
    @DisplayName("treesToNextLevel tests")
    class TreesToNextLevelTests {

        @ParameterizedTest
        @CsvSource({
            "0, 10",
            "5, 5",
            "9, 1",
            "10, 10",
            "15, 5",
            "25, 5"
        })
        @DisplayName("Should calculate trees to next level correctly")
        void shouldCalculateTreesToNextLevelCorrectly(int trees, int expectedToNext) {
            assertEquals(expectedToNext, TreeCalculator.treesToNextLevel(trees));
        }
    }

    @Nested
    @DisplayName("progressToNextLevel tests")
    class ProgressToNextLevelTests {

        @ParameterizedTest
        @CsvSource({
            "0, 0.0",
            "5, 50.0",
            "10, 0.0",
            "15, 50.0",
            "27, 70.0"
        })
        @DisplayName("Should calculate progress percentage correctly")
        void shouldCalculateProgressCorrectly(int trees, double expectedProgress) {
            assertEquals(expectedProgress, TreeCalculator.progressToNextLevel(trees), 0.01);
        }
    }
}
