package com.memorio.backend.exercise.dto;

public class NumberPegHint {

    private final Integer digit;
    private final String hintWord;

    public NumberPegHint(Integer digit, String hintWord){
        this.digit = digit;
        this.hintWord = hintWord;
    }

    public Integer getDigit(){return digit;}
    public String getHintWord(){return hintWord;}

}
