package com.memorio.backend.exercise;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class NumberPegHintId implements  Serializable{

    @Column(nullable = false)
    private Integer digit;

    @Column(nullable = false, length = 12)
    private String language;

    protected NumberPegHintId(){}

    public NumberPegHintId(Integer digit, String language){
        this.digit = digit;
        this.language = language;
    }

    public Integer getDigit(){return digit;}
    public String getLanguage(){return language;}
    @Override
    public boolean equals(Object o){
        if (this == o) return true;
        if(o == null || getClass() != o.getClass()) return false;

        NumberPegHintId that = (NumberPegHintId) o;
        return Objects.equals(digit, that.digit) &&
                Objects.equals(language, that.language);
    }

    @Override
    public int hashCode(){
        return Objects.hash(digit, language);
    }
}
