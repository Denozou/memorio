package com.memorio.backend.exercise.dto;

import java.util.List;
import java.util.Objects;

public class HistoryResponse {

    private final List<HistoryItem> items;
    private final int limit;
    private final int offset;
    private final long total;

    public HistoryResponse(List<HistoryItem> items, int limit, int offset, long total){
        this.items = Objects.requireNonNull(items, "items cannot be null");
        this.limit = limit;
        this.offset = offset;
        this.total = total;
    }

    public List<HistoryItem> getItems(){return items;}
    public int getLimit(){return limit;}
    public int getOffset(){return offset;}
    public long getTotal(){return total;}

}
