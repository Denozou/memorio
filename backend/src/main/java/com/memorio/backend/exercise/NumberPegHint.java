package com.memorio.backend.exercise;
import jakarta.persistence.*;


@Entity
@Table(name = "number_peg_hints")
public class NumberPegHint {
    @EmbeddedId
    private NumberPegHintId id;

    @Column(name = "hint_word", nullable = false, length = 100)
    private String hintWord;

    protected NumberPegHint(){}

    public NumberPegHint(Integer digit, String language, String hintWord){
        this.id = new NumberPegHintId(digit, language);
        this.hintWord = hintWord;
    }

    public Integer getDigit(){
        return id != null ? id.getDigit() : null;
    }

    public String getLanguage(){
        return id != null ? id.getLanguage() : null;
    }

    public String getHintWord(){return hintWord;}

    public void setHintWord(String hintWord){
        this.hintWord = hintWord;
    }

    public NumberPegHintId getId() {
        return id;
    }
}
