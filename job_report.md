## Job J-Engineering-2<a name="j-engineering-2"></a>
### Null safety
Handle nulls in a developer friendly way.


AI user is a required approver.
#### Tasks 
#### Task T-Engineering-4<a name="t-engineering-4"></a> 
Unit tests.

> ##### Grouped task C-Engineering-4<a name="c-engineering-4"></a> 
Test compile time nullable unassigned.

> ##### Grouped task C-Engineering-3<a name="c-engineering-3"></a> 
Test run time non-nullable unassigned.

> ##### Grouped task C-Engineering-2<a name="c-engineering-2"></a> 
Test compile time non-nullable unassigned.

> ##### Grouped task C-Engineering-5<a name="c-engineering-5"></a> 
Test run time nullable assigned null.

#### Task T-Engineering-3<a name="t-engineering-3"></a> 
Allow explicitly creating a variable as nullable. Variables are non-nullable by default.

#### Task T-Engineering-5<a name="t-engineering-5"></a> 
Implement a null safe operator:



obj?.prop: Returns obj.prop if obj exists; otherwise, it returns undefined.



obj?.[prop]: Returns obj[prop] if obj exists; otherwise, it returns undefined - for dynamic or special characters.



obj.method?.(): Calls obj.method() if obj.method exists; otherwise, it returns undefined.

#### Assistance 
#### Suggestion S-Engineering-1<a name="s-engineering-1"></a> 
Kotlin has good null handling <https://kotlinlang.org/docs/null-safety.html>.

> ##### $${\color{lightgreen} Reason \space For}$$ E-Default-1<a name="e-default-1"></a>
Yes I like the way Kotlin easily declares nullable or not.

