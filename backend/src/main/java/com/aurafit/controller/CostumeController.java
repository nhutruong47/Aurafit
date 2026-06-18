package com.aurafit.controller;

import com.aurafit.entity.Costume;
import com.aurafit.service.CostumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/costumes")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequiredArgsConstructor
public class CostumeController {

    private final CostumeService costumeService;

    @GetMapping
    public List<Costume> getCostumes(@RequestParam(required = false) String category) {
        if (category == null || category.isBlank()) {
            return costumeService.getAllCostumes();
        }

        return costumeService.getCostumesByCategory(category);
    }

    @GetMapping("/seasonal")
    public List<Costume> getSeasonalCostumes() {
        return costumeService.getSeasonalCostumes();
    }

    @GetMapping("/recommendations")
    public List<Costume> getRecommendedCostumes(@RequestParam(required = false) Long userId) {
        return costumeService.getRecommendedCostumes(userId);
    }
}
