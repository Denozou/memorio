package com.memorio.backend.exercise.dto;

public class NumberPegData {

    private final Integer digit;
    private final String hintWord;

    public NumberPegData(Integer digit, String hintWord){
        this.digit = digit;
        this.hintWord = hintWord;
    }

    public Integer getDigit(){return digit;}
    public String getHintWord(){return hintWord;}

}
