package com.memorio.backend.gamification;

import org.springframework.stereotype.Component;

@Component
public class TreeCalculator {

    public int calculateTrees(long points){
        if(points < 100){
            return 0;
        } else if (points <500) {
            return 1 + (int)((points - 100)/100); //1-5
        } else if (points < 2000) {
            return 5 + (int)((points - 500)/150); //5-15
        } else if (points < 5000) {
            return 15 + (int)((points - 2000)/200); // 15- 30
        }else if(points < 10000){
            return 30 + (int)((points - 5000)/250); //30-50
        }else{
            return 50 + (int)((points - 10000)/500); //50+
        }
    }


    public static int calculateLevel(int trees){
        return (trees/10) +1;
    }

    public static int treesToNextLevel(int trees){
        int currentLevel = calculateLevel(trees);
        int nextLevelThreshold = currentLevel *10;
        return nextLevelThreshold - trees;
    }

    public static double progressToNextLevel(int trees){
        int treesInCurrentLevel = trees % 10;
        return (treesInCurrentLevel / 10.0)*100.0;
    }
}
